#!/bin/bash
# Hybrid Web Summarizer — Backend Startup Script
# Run this once from the /backend directory

echo "Setting up virtual environment..."
if [ ! -d "venv" ]; then
  python3 -m venv venv
fi
source venv/bin/activate

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Starting FastAPI backend on port 7864..."
uvicorn app:app --host 127.0.0.1 --port 7864 --reload
