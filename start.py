import subprocess
import time
import webbrowser
import os

base = r"C:\Users\DELL\Desktop\YAMAN-MOTORS"

backend = os.path.join(base, "backend")
frontend = os.path.join(base, "frontend")

subprocess.Popen(
    ["python", "app.py"],
    cwd=backend
)

time.sleep(3)

subprocess.Popen(
    ["python", "-m", "http.server", "5500"],
    cwd=frontend
)

time.sleep(2)

webbrowser.open("http://localhost:5500")

print("YAMAN MOTORS is running.")
input("Press Enter to stop...")