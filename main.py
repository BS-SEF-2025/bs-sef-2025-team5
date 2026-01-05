import argparse
import cv2
import os
from ultralytics import YOLO

os.environ["QT_QPA_PLATFORM"] = "xcb"

class LibraryCounter:
    def __init__(self, model="yolo11n_ncnn_model"):
        print(f"Loading model: {model}...")
        self.model = YOLO(model)
        print("Model loaded.")

    def run(self):
        print("System ready. Logic pending.")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default="yolo11n_ncnn_model")
    args = parser.parse_args()
    LibraryCounter(model=args.model).run()

if __name__ == "__main__":
    main()