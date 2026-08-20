import cv2
import numpy as np


class ResistorCropper:
    def __init__(self, padding=0.10):
        self.padding= padding
        
    def crop(self, image,bbox):
        x1, y1, x2, y2 = bbox
        img_h, img_w = image.shape[:2]


        bbox_w = x2 - x1
        bbox_h = y2 - y1

        pad_x = int(bbox_w * self.padding)
        pad_y = int(bbox_h * self.padding)

        padded_x1 = max(0, x1 - pad_x)
        padded_y1 = max(0, y1 - pad_y)
        padded_x2 = min(img_w, x2 + pad_x)
        padded_y2 = min(img_h, y2 + pad_y)

        crop_img = image[padded_y1:padded_y2, padded_x1:padded_x2].copy()

        if crop_img.size == 0:
            return None

        ch, cw = crop_img.shape[:2]
        was_rotated = False

        if ch > cw:
            crop_img = cv2.rotate(crop_img, cv2.ROTATE_90_CLOCKWISE)
            was_rotated = True

        return {
            "crop" : crop_img,
            "padded_box": [padded_x1, padded_y1, padded_x2, padded_y2],
            "was_rotated": was_rotated
        }
