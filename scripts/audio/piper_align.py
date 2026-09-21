"""Synthesize lines with Piper AND return each line's exact phoneme timing (durations come from the model itself).

usage: python piper_align.py <voice_name> <voices_dir> <jobs.json>

jobs.json: [{"id": str, "text": str, "length_scale": float, "wav": path, "json": path}, ...]
wav  : mono 22.05 kHz, sentences joined by 0.22 s of silence (same as the piper CLI's --sentence-silence 0.22)
json : {"sample_rate": int, "phonemes": [{"p": str, "t0": s, "t1": s}, ...]}   times from the start of wav

Needs `pip install onnx` next to piper-tts (alignments patch the model in memory).
The model is loaded once for all jobs.
"""
import json
import sys
import wave

from piper import PiperVoice, SynthesisConfig

name, voices_dir, jobs_path = sys.argv[1:4]
SENTENCE_SILENCE = 0.22

voice = PiperVoice.load(f"{voices_dir}/{name}.onnx", include_alignments=True)
sr = voice.config.sample_rate

with open(jobs_path, encoding="utf-8") as f:
    jobs = json.load(f)

for job in jobs:
    cfg = SynthesisConfig(length_scale=float(job.get("length_scale", 1.0)), noise_scale=0.6, noise_w_scale=0.7)
    phonemes = []
    t = 0.0
    with wave.open(job["wav"], "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        for i, chunk in enumerate(voice.synthesize(job["text"], cfg, include_alignments=True)):
            if i > 0:
                gap = int(sr * SENTENCE_SILENCE)
                wf.writeframes(bytes(gap * 2))
                t += gap / sr
            wf.writeframes(chunk.audio_int16_bytes)
            for a in chunk.phoneme_alignments or []:
                d = a.num_samples / sr
                phonemes.append({"p": a.phoneme, "t0": round(t, 4), "t1": round(t + d, 4)})
                t += d
    if not phonemes:
        raise SystemExit(f"no alignment returned for {job['id']} (is the onnx package installed?)")
    with open(job["json"], "w", encoding="utf-8") as f:
        json.dump({"sample_rate": sr, "phonemes": phonemes}, f)
    print("ok", job["id"], round(t, 2), "s", flush=True)
