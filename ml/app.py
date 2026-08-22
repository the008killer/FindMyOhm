from fastapi import FastAPI,  File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from band_detector import BandDetector
from crop import ResistorCropper
from decoder import ResistorDecoder
from detector import ResistorDetector
import numpy as np
import cv2

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all frontend origins (React, Vue, HTML, etc.)
    allow_credentials=True,
    allow_methods=["*"],  # Allows POST, GET, OPTIONS, etc.
    allow_headers=["*"],
)

resistor_detector = ResistorDetector("./model/best.pt")
band_detector = BandDetector("./model/band.pt")
cropper = ResistorCropper(padding=0.10)
decoder = ResistorDecoder()

def bytes_to_cv2(image_bytes:bytes) -> np.ndarray:
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img

@app.get("/")
def func():
    return {"message":"server is running"}

@app.post("/detect")
async def detect_resistors(file: UploadFile = File(...)):
    """Accepts an image file and returns resistance details for all detected resistors."""
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload an image file (JPEG, PNG, etc.).",
        )

    # Read image file bytes
    contents = await file.read()
    image = bytes_to_cv2(contents)

    if image is None:
        raise HTTPException(
            status_code=400,
            detail="Could not decode image file. File may be corrupted.",
        )

    # Stage 1: Detect Resistors
    detections = resistor_detector.detect(image)

    resistor_results = []

    # Process each detected resistor
    for idx, det in enumerate(detections):
        bbox = det["bbox"]
        res_conf = det["confidence"]

        # Stage 2: Crop Resistor
        crop_data = cropper.crop(image, bbox)
        if crop_data is None:
            continue

        resistor_crop = crop_data["crop"]

        # Stage 3: Detect Color Bands
        bands = band_detector.detect_band(resistor_crop)

        # Stage 4: Extract Color List
        color_sequence = [b["color"] for b in bands]
        band_conf = [b['confidence'] for b in bands]

        # Stage 5: Decode Resistance Value
        decoded_result = decoder.decode(color_sequence)

        # Build JSON response structure for this resistor
        resistor_results.append(
            {
                "resistor_id": idx + 1,
                "confidence": round(res_conf, 4),
                "bbox": bbox,
                "bands_detected": color_sequence,
                "bands_confidence": band_conf,
                "calculation": decoded_result,
            }
        )

    return {
        "success": True,
        "filename": file.filename,
        "count": len(resistor_results),
        "resistors": resistor_results,
    }


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)