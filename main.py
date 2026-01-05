import argparse
import cv2
import time
import datetime
import os
import numpy as np
os.environ["QT_QPA_PLATFORM"] = "xcb"
from ultralytics import YOLO

class LibraryCounter:
    def __init__(self, source=0, model="yolo11n_ncnn_model", 
                 headless=False, log_file="counts.log", 
                 resolution=(640, 480),
                 line_position=0.5):
        self.headless = headless
        self.log_file = log_file
        # Camera and logic will be added by team members
    
        print(f"Initializing camera (source: {source})...")
        self.cap = cv2.VideoCapture(source)
        
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, resolution[0])
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, resolution[1])
        self.cap.set(cv2.CAP_PROP_FPS, 60)
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        self.cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*'MJPG'))
        
        if not self.cap.isOpened():
            raise RuntimeError(f"Could not open camera: {source}")
        
        self.frame_width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.frame_height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        print(f"Resolution: {self.frame_width}x{self.frame_height}")
        
        # Vertical line x position
        self.line_x = int(self.frame_width * line_position)
        
        print(f"Counting line at x={self.line_x}")
        print(f"Loading model: {model}...")
        
        # Load YOLO directly (no ObjectCounter)
        self.model = YOLO(model)
        
        self.in_count = 0
        self.out_count = 0
        
        # Track previous positions of detected people (by track ID)
        self.prev_positions = {}  # track_id -> x position
        self.crossed_ids = {}     # track_id -> timestamp (cooldown to prevent double count)
        self.cooldown = 0.5       # seconds before same person can be counted again
        
        print("Ready! (Simple line crossing mode)")
    
    def log_count(self, in_count, out_count):
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"{timestamp} | IN: {in_count} | OUT: {out_count} | Inside: {in_count - out_count}\n"
        with open(self.log_file, "a") as f:
            f.write(log_entry)
       
    def run(self):
        print("System Initialized. Waiting for modules.")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", default=0)
    parser.add_argument("--model", default="yolo11n_ncnn_model")
    parser.add_argument("--headless", action="store_true")
    parser.add_argument("--log", default="counts.log")
    parser.add_argument("--line-pos", type=float, default=0.5)
    parser.add_argument("--width", type=int, default=640)
    parser.add_argument("--height", type=int, default=480)
    parser.add_argument("--cooldown", type=float, default=0.5)
    args = parser.parse_args()
    
    counter = LibraryCounter(
        source=args.source,
        model=args.model,
        headless=args.headless,
        log_file=args.log,
        resolution=(args.width, args.height),
        line_position=args.line_pos
    )
    counter.run()




if __name__ == "__main__":
    main()