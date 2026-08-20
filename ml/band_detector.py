from ultralytics import YOLO

class BandDetector:
    def __init__(self, model_path, confidence=0.5):
        self.confidence = confidence
        self.model = YOLO(model_path)

    def detect_band(self, image):
        results = self.model.predict(
            image, conf=self.confidence, verbose=False
        )
        result = results[0]

        bands = []
        for box in result.boxes:
            cls_id = int(box.cls[0].cpu().numpy())
            color_name = self.model.names[cls_id]
            conf = float(box.conf[0].cpu().numpy())
            xyxy = box.xyxy[0].cpu().numpy().astype(int).tolist()

            cx = (xyxy[0] + xyxy[2]) / 2.0

            bands.append(
                {
                    "color":color_name,
                    "confidence": conf,
                    "bbox": xyxy,
                    "cx": cx
                }
            )

            bands.sort(key=lambda b:b["cx"])
            return bands

