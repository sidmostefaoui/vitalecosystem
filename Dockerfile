FROM python:3.11-slim

WORKDIR /app

# Set environment variable for production
ENV VITAL_ENV=PROD

# Copy backend requirements and install them
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ backend/
COPY database/ database/

# Install Node.js and npm for frontend
RUN apt-get update && apt-get install -y \
    curl \
    && curl -sL https://deb.nodesource.com/setup_16.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

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

# Expose the app port
EXPOSE 8080

# Start the application
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"] 