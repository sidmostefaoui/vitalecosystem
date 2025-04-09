FROM nikolaik/python-nodejs:python3.11-nodejs22-slim

WORKDIR /app

# Copy backend requirements and install them
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ backend/
COPY database/ database/

# Copy frontend code and build it
COPY frontend/ frontend/
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# Set up the database
WORKDIR /app

# Create the prod database directory (matches the path in main.py)
RUN mkdir -p database/prod
# Run the database creation script
RUN cd database/prod && python ../prod/create_db.py

# Change to backend directory
WORKDIR /app/backend

EXPOSE 8080
# Start the application from backend directory
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"] 