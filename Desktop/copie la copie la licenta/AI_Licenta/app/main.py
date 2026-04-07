import io
import json
import os
from typing import List

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from google import generativeai as genai
from PIL import Image


app = FastAPI(
    title="AI Product Validation API",
    description="Gemini-powered API for product esthetic/shape validation and device/model detection.",
    version="1.0.0",
)


def _configure_gemini() -> genai.GenerativeModel:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="Missing GEMINI_API_KEY. Set it as an environment variable.",
        )

    genai.configure(api_key=api_key)
    return genai.GenerativeModel("gemini-1.5-flash")


def _read_upload_image(upload: UploadFile) -> Image.Image:
    try:
        content = upload.file.read()
        img = Image.open(io.BytesIO(content)).convert("RGB")
        return img
    except Exception as exc:
        raise HTTPException(
            status_code=400, detail=f"Invalid image file '{upload.filename}'."
        ) from exc


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/analyze/esthetic-shape")
async def analyze_esthetic_and_shape(
    photos: List[UploadFile] = File(...),
    product_description: str = Form(""),
) -> dict:
    if len(photos) < 2:
        raise HTTPException(
            status_code=400, detail="Please provide at least 2 photos for comparison."
        )

    model = _configure_gemini()
    image_parts = []
    for upload in photos:
        image_parts.append(_read_upload_image(upload))

    prompt = f"""
You are a product quality analyst.
Task:
1) Compare all provided images of the same product.
2) Validate esthetic quality (scratches, dents, color inconsistency, visible damage, finishing quality).
3) Validate shape wellness (deformations, symmetry issues, bent or broken parts, alignment).
4) If possible from images and description, estimate basic functionality signals (e.g., visible missing buttons/ports, broken screen, detached parts).

Product description:
{product_description}

Return strict JSON with this schema:
{{
  "overall_score": number,  // 0-100
  "esthetic_quality": {{
    "score": number,         // 0-100
    "issues": [string]
  }},
  "shape_wellness": {{
    "score": number,         // 0-100
    "issues": [string]
  }},
  "functionality_hint": {{
    "possible": boolean,
    "notes": [string]
  }},
  "cross_photo_consistency": {{
    "consistent_product": boolean,
    "notes": [string]
  }},
  "final_verdict": string
}}
"""

    response = model.generate_content([prompt, *image_parts])
    text = (response.text or "").strip()

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        parsed = {
            "raw_response": text,
            "warning": "Model did not return strict JSON. Prompt can be tuned further.",
        }

    return {"result": parsed}


@app.post("/analyze/device-model")
async def detect_device_and_model(
    photos: List[UploadFile] = File(...),
    product_description: str = Form(""),
) -> dict:
    if len(photos) < 1:
        raise HTTPException(status_code=400, detail="Please provide at least 1 photo.")

    model = _configure_gemini()
    image_parts = [_read_upload_image(upload) for upload in photos]

    prompt = f"""
You are a device identification expert.
Use images and description to infer:
1) device category (phone/laptop/tablet/watch/headphones/other)
2) brand (if possible)
3) likely model(s), with confidence score
4) key visual clues that support each guess
5) ambiguity explanation and what extra photo angles would improve certainty

Product description:
{product_description}

Return strict JSON:
{{
  "device_type": string,
  "brand": string,
  "candidates": [
    {{
      "model": string,
      "confidence": number,      // 0-1
      "evidence": [string]
    }}
  ],
  "needs_more_evidence": boolean,
  "recommended_extra_photos": [string]
}}
"""

    response = model.generate_content([prompt, *image_parts])
    text = (response.text or "").strip()

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        parsed = {
            "raw_response": text,
            "warning": "Model did not return strict JSON. Prompt can be tuned further.",
        }

    return {"result": parsed}
