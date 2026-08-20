# start.ps1

Write-Host "Starting FindMyOhm Stack..." -ForegroundColor Green

# 1. Start Python ML FastAPI Server
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ml; .\venv\Scripts\Activate.ps1; uvicorn app:app --port 8000 --reload"

# 2. Start Node.js Server
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm run dev"

# 3. Start Frontend Client
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; npx http-server -p 3000"

Write-Host "All 3 services launched in separate windows!" -ForegroundColor Cyan