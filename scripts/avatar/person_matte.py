"""Soft person matte of the avatar image (DeepLabV3, torchvision, local). Used to move ONLY the body in body_motion.py.

usage: python person_matte.py <image.png> <matte.png>
matte.png: 8-bit grey, 255 = person. Needs torch + torchvision (the SadTalker venv has them); weights (~160 MB) download once.
"""
import sys

import numpy as np
import torch
import torchvision
from PIL import Image
from torchvision.models.segmentation import DeepLabV3_ResNet50_Weights, deeplabv3_resnet50

src, out = sys.argv[1:3]
weights = DeepLabV3_ResNet50_Weights.DEFAULT
model = deeplabv3_resnet50(weights=weights).eval()
img = Image.open(src).convert("RGB")
batch = weights.transforms()(img).unsqueeze(0)
with torch.no_grad():
    logits = model(batch)["out"]
prob = torch.softmax(logits, dim=1)[0, 15]  # class 15 = person
prob = torch.nn.functional.interpolate(prob[None, None], size=(img.height, img.width), mode="bilinear", align_corners=False)[0, 0]
Image.fromarray((prob.numpy() * 255).astype(np.uint8)).save(out)
print("ok", out, "person area", round(float(prob.mean()), 3))
