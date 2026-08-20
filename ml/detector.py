from ultralytics import YOLO
import numpy as np
import cv2


class ResistorDetector:

    # runs by default when object is created
    def __init__(self,model_path):
        self.confidence = 0.65
        self.model = YOLO(model_path)
        print("Model loaded")

    #runs when we want to detect
    def detect(self, image):
        results = self.model.predict(image, conf=self.confidence, verbose=False)
        result = results[0]

        detections = []
        for box in result.boxes:
            xyxy = box.xyxy[0].cpu().numpy().astype(int)
            conf = float(box.conf[0].cpu().numpy())

            detections.append({
                "bbox": xyxy.tolist(),
                "confidence": conf
            })

        return detections


# if __name__ == "__main__":
#     detector = ResistorDetector("./model/best.pt")

#     image = cv2.imread("2.jpg")

#     if image is None:
#         print("add image")
#         exit()

#     else:
#         detections = detector.detect(image)
#         print(f"Found {len(detections)} resistors")
#         for det in detections:
#             print(f"{det}")