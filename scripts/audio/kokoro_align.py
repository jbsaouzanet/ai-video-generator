"""Synthesize lines with Kokoro (82M neural TTS, local) AND return every written word's exact time.

usage: python kokoro_align.py <voice> <jobs.json>

jobs.json: [{"id": str, "text": str, "speed": float, "wav": path, "json": path}, ...]
wav  : mono 24 kHz
json : {"sample_rate": int, "words": [{"t": str, "t0": s, "t1": s}, ...]}   times from the start of wav

Kokoro's own duration predictor gives a start/end time for every token. Tokens are re-grouped into the
WRITTEN words (whitespace separated), so "D-pad" or "don't" stay one word: no phoneme matching is needed.
<voice> may be a single Kokoro voice ("am_michael") or a blend ("am_michael,am_adam").
"""
import json
import sys
import wave

import numpy as np
from kokoro import KPipeline

voice, jobs_path = sys.argv[1:3]
SR = 24000
pipe = KPipeline(lang_code="a", repo_id="hexgrad/Kokoro-82M")
voice_arg = voice
if "," in voice or "=" in voice:  # blend: weighted average of the style vectors, "am_onyx=0.7,am_michael=0.3" (no weight = equal)
    import torch

    specs = [p.split("=") for p in voice.split(",")]
    weights = torch.tensor([float(s[1]) if len(s) > 1 else 1.0 for s in specs])
    weights = weights / weights.sum()
    packs = torch.stack([pipe.load_voice(s[0]) for s in specs])
    voice_arg = (packs * weights.view(-1, *([1] * (packs.dim() - 1)))).sum(dim=0)

with open(jobs_path, encoding="utf-8") as f:
    jobs = json.load(f)

for job in jobs:
    chunks = []
    words = []
    offset = 0.0
    cur = None  # written word being built: [text, t0, t1]
    for r in pipe(job["text"], voice=voice_arg, speed=float(job.get("speed", 1.0)), split_pattern=r"\n+"):
        audio = r.audio.detach().cpu().numpy().astype(np.float32)
        for tok in r.tokens or []:
            if cur is None:
                cur = [tok.text, None, None]
            else:
                cur[0] += tok.text
            # punctuation tokens carry the PAUSE ("," "." "?"): keep them in the text, not in the word's time span
            is_punct = not any(c.isalnum() for c in tok.text)
            if not is_punct and tok.start_ts is not None and tok.end_ts is not None:
                if cur[1] is None:
                    cur[1] = offset + tok.start_ts
                cur[2] = offset + tok.end_ts
            if tok.whitespace:  # misaki keeps the space after a word in .whitespace: it closes the written word
                words.append(cur)
                cur = None
        if cur is not None:  # end of chunk closes the word too
            words.append(cur)
            cur = None
        chunks.append(audio)
        offset += len(audio) / SR
    pcm = np.concatenate(chunks) if chunks else np.zeros(0, dtype=np.float32)
    with wave.open(job["wav"], "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes((np.clip(pcm, -1, 1) * 32767).astype("<i2").tobytes())
    out = [{"t": w[0], "t0": round(w[1], 4), "t1": round(w[2], 4)} for w in words if w[1] is not None]
    with open(job["json"], "w", encoding="utf-8") as f:
        json.dump({"sample_rate": SR, "words": out}, f)
    print("ok", job["id"], round(len(pcm) / SR, 2), "s", len(out), "words", flush=True)
