# FindMyOhm

FindMyOhm is a simple web app that helps identify resistor values from a photo. A user uploads an image of a resistor, the app detects the resistor and its color bands, and then estimates the resistance value.

It uses a Node.js backend for the web API and a Python FastAPI service with computer vision models to detect and decode the bands.

## What it does

- Upload an image of a resistor from the browser
- Detect the resistor in the image
- Read the color bands
- Decode the resistance value and tolerance
- Return the result through a simple API and web UI

## Project structure

- client: frontend web app
- server: Express API that handles uploads and proxies requests to the ML service
- ml: Python model and FastAPI service used for detection and decoding

## Run locally

1. Install Python dependencies in the ml folder

   cd ml
   pip install -r requirements.txt

2. Start the ML service

   python app.py

   or

   uvicorn app:app --host 0.0.0.0 --port 8000

3. Install Node dependencies in the server folder

   cd server
   npm install

4. Start the web server

   npm run dev

5. Open the app in the browser at

   http://localhost:3001

## API endpoints

### Node server

#### GET /api/health
Checks whether the backend is running.

Example response:

```json
{
  "success": true,
  "message": "FindMyOhm is running!",
  "timestamp": "2026-08-20T00:00:00.000Z"
}
```

#### POST /api/analyze
Uploads an image file and analyzes it.

Request:
- Form-data field: image
- Accepts: image/jpeg, image/png, image/webp

Example:

```bash
curl -X POST "http://localhost:3001/api/analyze" -F "image=@your-image.jpg"
```

Example response:

```json
{
  "success": true,
  "data": {
    "success": true,
    "filename": "resistor.jpg",
    "count": 1,
    "resistors": [
      {
        "resistor_id": 1,
        "confidence": 0.99,
        "bands_detected": ["brown", "black", "red", "gold"],
        "calculation": {
          "formatted": "1k Ω",
          "tolerance": "5%"
        }
      }
    ]
  }
}
```

### ML service

#### GET /
Simple health check for the FastAPI app.

#### POST /detect
Accepts a single uploaded image file and returns detected resistor results.

Request:
- Form-data field: file
- File type must be an image

Example:

```bash
curl -X POST "http://localhost:8000/detect" -F "file=@your-image.jpg"
```

## Notes

This project is a small image-analysis tool for resistor recognition. It is useful for quick testing and demonstration, and it can be extended with better models or a more polished UI.

