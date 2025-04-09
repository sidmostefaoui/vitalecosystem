# Save the current directory
$originalLocation = Get-Location

# Navigate to the frontend directory
Set-Location frontend

# Install dependencies if needed (uncomment if you want to run this every time)
# npm install

try {
    # Start the Vite development server
    $env:VITAL_ENV = "DEV"
    $env:VITE_API_URL = 'http://localhost:8080/api'
    npm run dev
}
finally {
    # Clear the screen
    Clear-Host
    
    # Return to the original directory
    Set-Location $originalLocation
} 