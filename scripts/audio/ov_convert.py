"""Timbre conversion with OpenVoice V2 (local): make a Kokoro line sound like the user's voice, or a blend of the user and Kokoro.

Only the TIMBRE moves. Rhythm, words and length are the source's, so the word timings measured on the Kokoro audio stay valid.

usage:
  python ov_convert.py se <ckpt_dir> <out.pth> <wav> [<wav> ...]
      speaker embedding ("timbre fingerprint") of one or several clean wav files of ONE speaker
  python ov_convert.py convert <ckpt_dir> <src_se.pth> <tgt_se.pth> <alpha> <tau> <jobs.json>
      jobs.json: [{"in": wav, "out": wav}, ...]   alpha = share of the TARGET voice (0 = source voice, 1 = target voice)
      the model is loaded once for all jobs; output is mono 22.05 kHz

OpenVoice is imported from OPENVOICE_DIR (a git checkout); its text front-end (needs Chinese/Japanese NLP packages, useless
for conversion) is replaced by a stub. librosa >= 0.10 needs keyword arguments in mel_processing.py (patched in the checkout).
"""
import json
import os
import sys
import types

sys.path.insert(0, os.environ["OPENVOICE_DIR"])
stub = types.ModuleType("openvoice.text")
stub.text_to_sequence = lambda *a, **k: None
sys.modules["openvoice.text"] = stub

import torch  # noqa: E402
from openvoice.api import ToneColorConverter  # noqa: E402

mode, ckpt = sys.argv[1], sys.argv[2]
conv = ToneColorConverter(f"{ckpt}/converter/config.json", device="cpu", enable_watermark=False)
conv.load_ckpt(f"{ckpt}/converter/checkpoint.pth")

if mode == "se":
    out, wavs = sys.argv[3], sys.argv[4:]
    se = conv.extract_se(wavs)
    torch.save(se, out)
    print("ok se", tuple(se.shape), "from", len(wavs), "file(s)")
elif mode == "convert":
    src_p, tgt_p, alpha, tau, jobs_p = sys.argv[3:8]
    alpha, tau = float(alpha), float(tau)
    src = torch.load(src_p, map_location="cpu")
    tgt = torch.load(tgt_p, map_location="cpu")
    target = src + alpha * (tgt - src)  # linear blend of the two timbres
    with open(jobs_p, encoding="utf-8") as f:
        jobs = json.load(f)
    for j in jobs:
        conv.convert(audio_src_path=j["in"], src_se=src, tgt_se=target, output_path=j["out"], tau=tau, message="")
        print("ok", j["out"], flush=True)
else:
    raise SystemExit(__doc__)
