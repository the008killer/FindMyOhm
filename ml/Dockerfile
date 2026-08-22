FROM python:3.11-slim

# Set the working directory
WORKDIR /app

# System dependencies required by OpenCV
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libgl1 \
    libglib2.0-dev \
    libsm6 \
    libxext6 \
    libxrender1 \
    libxcb1 \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file and install dependencies
COPY ./requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt


# Copy the rest of your application code
COPY ./ /app

# Set the PORT environment variable to match Render's requirements
ENV PORT="8080"

# Command to run the app, using the specified port
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080"]
