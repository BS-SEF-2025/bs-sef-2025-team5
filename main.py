import argparse
import cv2
import time
import datetime
import os
import requests
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
            
    def sync_to_api(self, direction=None):
        """Send count to backend API"""
        try:
            current_count = max(0, self.in_count - self.out_count)
            data = {
                "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
                "current_count": current_count,
                "direction": direction
            }
            response = requests.post(
                "http://192.168.68.72:3000/api/occupancy/update",
                json=data,
                timeout=5
            )
            print(f"[API] Synced: {current_count} inside")
        except Exception as e:
            print(f"[API] Sync failed: {e}")

    def run(self, log_interval=60):
        print("\n" + "=" * 50)
        print("LIBRARY COUNTER - SIMPLE CROSSING")
        print("=" * 50)
        print("-> = IN    <- = OUT")
        if not self.headless:
            print("Keys: q=quit  r=reset  s=swap")
        print("=" * 50 + "\n")

        last_log_time = time.time()
        last_print_time = time.time()
        swap_counts = False

        fps_counter = 0
        fps_timer = time.time()
        fps = 0

        try:
            while True:
                ret, frame = self.cap.read()
                if not ret:
                    continue

                fps_counter += 1

                if time.time() - fps_timer >= 1.0:
                    fps = fps_counter
                    fps_counter = 0
                    fps_timer = time.time()

                # Run detection with tracking
                results = self.model.track(frame, classes=[0], persist=True,
                                           verbose=False, conf=0.25)

                current_time = time.time()

                # Clean old crossed IDs (remove cooldown entries older than cooldown time)
                self.crossed_ids = {k: v for k, v in self.crossed_ids.items()
                                    if current_time - v < self.cooldown}

                # Process detections
                if results and len(results) > 0 and results[0].boxes is not None:
                    boxes = results[0].boxes

                    for box in boxes:
                        # Get center x position
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        center_x = (x1 + x2) / 2
                        center_y = (y1 + y2) / 2

                        # Get track ID
                        if box.id is not None:
                            track_id = int(box.id[0])
                        else:
                            continue  # Skip if no track ID

                        # Check if this person crossed the line
                        if track_id in self.prev_positions:
                            prev_x = self.prev_positions[track_id]

                            # Check if crossed and not in cooldown
                            if track_id not in self.crossed_ids:
                                # Crossed from left to right (IN)
                                if prev_x < self.line_x and center_x >= self.line_x:
                                    if swap_counts:
                                        self.out_count += 1
                                    else:
                                        self.in_count += 1
                                    self.crossed_ids[track_id] = current_time
                                    print(f"*** IN *** (total: {self.in_count})")
                                    self.sync_to_api("IN")

                                # Crossed from right to left (OUT)
                                elif prev_x > self.line_x and center_x <= self.line_x:
                                    if swap_counts:
                                        self.in_count += 1
                                    else:
                                        self.out_count += 1
                                    self.crossed_ids[track_id] = current_time
                                    print(f"*** OUT *** (total: {self.out_count})")
                                    self.sync_to_api("OUT")

                        # Update position
                        self.prev_positions[track_id] = center_x

                # Get annotated frame
                result_frame = results[0].plot() if results else frame.copy()

                # Print status every 5 seconds
                if time.time() - last_print_time >= 5:
                    inside = max(0, self.in_count - self.out_count)
                    print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] "
                          f"IN: {self.in_count} | OUT: {self.out_count} | "
                          f"Inside: {inside} | FPS: {fps}")
                    last_print_time = time.time()

                # Log periodically
                if time.time() - last_log_time >= log_interval:
                    self.log_count(self.in_count, self.out_count)
                    last_log_time = time.time()

                # Display
                if not self.headless:
                    # Draw vertical counting line
                    cv2.line(result_frame, (self.line_x, 0), (self.line_x, self.frame_height),
                             (0, 255, 255), 2)

                    inside = max(0, self.in_count - self.out_count)
                    cv2.rectangle(result_frame, (5, 5), (150, 85), (0, 0, 0), -1)
                    cv2.putText(result_frame, f"IN:  {self.in_count}", (10, 25),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                    cv2.putText(result_frame, f"OUT: {self.out_count}", (10, 50),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
                    cv2.putText(result_frame, f"NOW: {inside}", (10, 75),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)

                    cv2.putText(result_frame, f"FPS: {fps}", (self.frame_width - 80, 20),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

                    cv2.imshow("Library Counter", result_frame)

                    key = cv2.waitKey(1) & 0xFF
                    if key == ord('q'):
                        break
                    elif key == ord('r'):
                        self.in_count = 0
                        self.out_count = 0
                        self.prev_positions = {}
                        self.crossed_ids = {}
                        print("Counts reset!")
                    elif key == ord('s'):
                        swap_counts = not swap_counts
                        print(f"Swapped: {swap_counts}")

        except KeyboardInterrupt:
            print("\nStopped")

        finally:
            self.cleanup()
            self.log_count(self.in_count, self.out_count)
            print(f"\nFINAL: IN={self.in_count} OUT={self.out_count}")

    def cleanup(self):
        if self.cap:
            self.cap.release()
        cv2.destroyAllWindows()


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