# Save the current directory
$originalLocation = Get-Location

# Navigate to the backend directory
Set-Location backend

# Activate the virtual environment
.\venv\Scripts\Activate.ps1

try { 
    # Start the FastAPI server using uvicorn
    # Using host 127.0.0.1 to allow local access and port 8000
    uvicorn main:app --host 127.0.0.1 --port 8000 --reload
}
finally {
    # This block will run even when CTRL+C is pressed
    
    # Deactivate the virtual environment
    deactivate
    
    # Clear the screen
    Clear-Host
    
    # Return to the original directory
    Set-Location $originalLocation
}
