import subprocess
import sys
import time
import webbrowser
from pathlib import Path

def run_backend():
    print("Starting backend server...")
    backend_process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8000"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    return backend_process

def run_frontend():
    print("Starting frontend server...")
    frontend_process = subprocess.Popen(
        [sys.executable, "frontend/server.py"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    return frontend_process

def main():
    # Create necessary directories
    Path("data/raw").mkdir(parents=True, exist_ok=True)
    Path("data/processed").mkdir(parents=True, exist_ok=True)
    Path("data/models").mkdir(parents=True, exist_ok=True)
    
    # Generate data if needed
    print("Generating data...")
    subprocess.run([sys.executable, "data_generator.py"])
    
    # Train model if needed
    print("Training model...")
    subprocess.run([sys.executable, "test_model.py"])
    
    # Start servers
    backend_process = run_backend()
    frontend_process = run_frontend()
    
    # Wait for servers to start
    time.sleep(2)
    
    # Open browser
    print("Opening dashboard in browser...")
    webbrowser.open("http://localhost:3000")
    
    try:
        # Keep the script running
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down servers...")
        backend_process.terminate()
        frontend_process.terminate()
        print("Servers shut down successfully.")

if __name__ == "__main__":
    main() 