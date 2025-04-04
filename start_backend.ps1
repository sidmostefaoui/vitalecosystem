# Navigate to the backend directory
Set-Location backend

# Activate the virtual environment
.\venv\Scripts\Activate.ps1

# Start the FastAPI server using uvicorn
# Using host 0.0.0.0 to allow external access and port 8000
uvicorn main:app --host 127.0.0.1 --port 8000 --reload 