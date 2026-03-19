#!/bin/bash
# TL;DRead — Backend Startup Script
# Run this once from the /backend directory

echo "Setting up virtual environment..."
if [ ! -d "venv" ]; then
  python3 -m venv venv
fi
source venv/bin/activate

echo "Installing dependencies..."
./venv/bin/pip install -r requirements.txt

if [ ! -f ../extension/favicon.png ]; then
  echo "Generating favicon..."
  ./venv/bin/python generate_favicon.py
fi

echo "Starting FastAPI backend on port 7864..."
./venv/bin/uvicorn app:app --host 127.0.0.1 --port 7864 --reload
