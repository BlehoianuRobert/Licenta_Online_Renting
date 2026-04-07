# AI Product Validator (Docker + Gemini)

This service provides:
- Product esthetic + shape wellness comparison across multiple photos.
- Basic functionality hints (when possible from image evidence).
- Device type + likely model detection from photos and product description.

## 1) Set your Gemini API key

Do not hardcode your key in source files.

PowerShell:

```powershell
$env:GEMINI_API_KEY="YOUR_KEY_HERE"
```

Or create a `.env` file in this folder:

```env
GEMINI_API_KEY=YOUR_KEY_HERE
```

## 2) Build and run with Docker

```powershell
docker compose up --build
```

API runs at: `http://localhost:8001` (mapped from container port 8000; change in `docker-compose.yml` if 8001 is taken)

Swagger docs: `http://localhost:8001/docs`

## 3) Endpoints

### `POST /analyze/esthetic-shape`
- `photos`: multiple image files (at least 2)
- `product_description`: optional text

Returns JSON with quality scores, issues, cross-photo consistency, and final verdict.

### `POST /analyze/device-model`
- `photos`: one or more image files
- `product_description`: optional text

Returns likely device type, brand, model candidates, confidence, and required extra photos.

## 4) Quick curl examples

Esthetic/shape:

```bash
curl -X POST "http://localhost:8001/analyze/esthetic-shape" \
  -F "photos=@photo1.jpg" \
  -F "photos=@photo2.jpg" \
  -F "product_description=Used smartphone, black, 6.1 inch display"
```

Device/model:

```bash
curl -X POST "http://localhost:8001/analyze/device-model" \
  -F "photos=@photo1.jpg" \
  -F "photos=@photo2.jpg" \
  -F "product_description=Phone with dual camera and notch display"
```

## Notes
- Results are AI estimations and may require manual verification.
- Model output is prompted as strict JSON. If the model returns plain text, raw output is returned with a warning.
