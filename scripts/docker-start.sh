#!/bin/bash

# Change to the project root directory (parent of the script directory)
cd "$(dirname "$0")/.."

# Get the current git commit hash
COMMIT_HASH=$(git rev-parse --short HEAD)
if [ -z "$COMMIT_HASH" ]; then
  COMMIT_HASH="unknown"
fi

echo "Building Docker image with commit $COMMIT_HASH..."
docker build --build-arg NODE_COMMIT_TEAPOT=$COMMIT_HASH -t hc-teapot .

# Create necessary directories if they don't exist
mkdir -p public/uploads
mkdir -p data

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Warning: .env file not found. Creating from .env.example..."
    cp .env.example .env
fi

echo "Running container..."
docker stop hc-teapot >/dev/null 2>&1
docker rm hc-teapot >/dev/null 2>&1

docker run -d \
  --name hc-teapot \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env \
  -v "$(pwd)/public/uploads:/app/public/uploads" \
  -v "$(pwd)/data:/app/data" \
  hc-teapot

echo "Container started."