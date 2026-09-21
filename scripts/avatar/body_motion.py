"""Body life for the talking-head avatar: SadTalker only animates the face, a frozen body is what makes it look fake.
This adds, on top of SadTalker's video, a subtle non-rigid warp weighted by the person matte (background never moves):
  - breathing: the SIDES of the shoulders lift and widen a little, irregular rhythm (~16 breaths per minute); the neck column is left alone
  - voice emphasis: shoulders lift a bit more when the voice is loud
  - slow drift + bob of the whole person as one rigid block (no rotation: rotating head vs torso shears the neck, it looked like a snake)
  - the mic and its arm (fixed to the desk) are excluded
usage: python body_motion.py <sadtalker.mp4> <matte.png> <out.mp4> [strength=1.0] [seed=0]
Motion is defined for a 512 px frame and scaled to the video size. Audio is copied from the input file.
"""
import subprocess
import sys

import cv2
import numpy as np

src, matte_path, out = sys.argv[1:4]
strength = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0
seed = int(sys.argv[5]) if len(sys.argv) > 5 else 0
rng = np.random.default_rng(seed)

cap = cv2.VideoCapture(src)
W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
n_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
k = W / 512.0  # motion amplitudes are written for 512 px

# ---- weights: where the body may move ----
m = cv2.imread(matte_path, cv2.IMREAD_GRAYSCALE).astype(np.float32) / 255.0
m = cv2.resize(m, (W, H), interpolation=cv2.INTER_LINEAR)
s = np.clip((m - 0.45) / 0.4, 0, 1)
weight = s * s * (3 - 2 * s)  # smoothstep: sharper than the raw matte, still soft
excl = np.zeros((H, W), np.float32)  # mic + boom arm are fixed to the desk
cv2.ellipse(excl, (int(262 * k), int(445 * k)), (int(48 * k), int(95 * k)), 0, 0, 360, 1.0, -1)
cv2.rectangle(excl, (int(330 * k), int(392 * k)), (W, H), 1.0, -1)
excl = cv2.GaussianBlur(excl, (0, 0), 10 * k)
weight = (weight * (1 - np.clip(excl, 0, 1))).astype(np.float32)
weight = cv2.GaussianBlur(weight, (0, 0), 3 * k)

X, Y = np.meshgrid(np.arange(W, dtype=np.float32), np.arange(H, dtype=np.float32))
ss = lambda a, b, x: np.clip((x - a) / (b - a), 0, 1) ** 2 * (3 - 2 * np.clip((x - a) / (b - a), 0, 1))
px = W / 2.0
# Breathing only lifts the SIDES of the shoulders (trapezius), never the neck column: nothing stretches between head and torso.
# 0 in the neck / collar column, 1 out on the shoulders, and 0 above the collar line.
side = ss(0.13 * W, 0.26 * W, np.abs(X - px)) * ss(0.66 * H, 0.80 * H, Y)
sign = np.sign(X - px)

# ---- voice envelope (0..1), one value per video frame ----
pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-vn', '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True).stdout
a = np.frombuffer(pcm, np.float32) if pcm else np.zeros(1, np.float32)
hop = 16000 / fps
env = np.array([np.sqrt(np.mean(a[int(i * hop): int((i + 1) * hop) + 320] ** 2) + 1e-9) for i in range(n_frames)])
ref = np.percentile(env, 95) + 1e-9
env = np.clip(env / ref, 0, 1)
for i in range(1, n_frames):  # smooth: shoulders follow phrases, not syllables
    env[i] = 0.85 * env[i - 1] + 0.15 * env[i]

ph = rng.uniform(0, 2 * np.pi, 8)
proc = subprocess.Popen(
    ['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(fps), '-i', '-', '-i', src,
     '-map', '0:v', '-map', '1:a?', '-c:v', 'libx264', '-crf', '14', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', out],
    stdin=subprocess.PIPE)

peak = 0.0
for i in range(n_frames):
    ok, frame = cap.read()
    if not ok:
        break
    t = i / fps
    breath = 0.6 * (0.5 - 0.5 * np.cos(2 * np.pi * 0.27 * t + ph[0])) + 0.4 * (0.5 - 0.5 * np.cos(2 * np.pi * 0.113 * t + ph[1]))
    # whole person (head + torso) moves as ONE rigid block: slow drift + small bob, so nothing shears at the neck
    dx = strength * k * (1.6 * np.sin(2 * np.pi * 0.09 * t + ph[4]) + 0.6 * np.sin(2 * np.pi * 0.23 * t + ph[2]))
    dy = strength * k * (1.0 * np.sin(2 * np.pi * 0.17 * t + ph[5]) + 0.4 * np.sin(2 * np.pi * 0.41 * t + ph[3]))
    lift = strength * k * (2.4 * breath + 1.4 * env[i]) * side
    dy = dy - lift
    dx = dx + strength * k * 0.8 * breath * side * sign
    peak = max(peak, float(np.abs(weight * dy).max()), float(np.abs(weight * dx).max()))
    mx = (X - weight * dx).astype(np.float32)
    my = (Y - weight * dy).astype(np.float32)
    proc.stdin.write(cv2.remap(frame, mx, my, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE).tobytes())

proc.stdin.close()
proc.wait()
print(f'ok {out}  {n_frames} frames  {W}x{H}  max displacement {peak:.1f}px')
