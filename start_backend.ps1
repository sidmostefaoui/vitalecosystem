# Save the current directory
$originalLocation = Get-Location

# Navigate to the backend directory

# Activate the virtual environment
.\backend\.venv\Scripts\Activate.ps1

try { 
    $env:VITAL_ENV = "DEV"
    Set-Location backend
    uvicorn main:app --host 0.0.0.0 --port 8080 --reload
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
