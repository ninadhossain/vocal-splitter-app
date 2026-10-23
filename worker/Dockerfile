FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download default htdemucs weights into container cache
RUN python -c "from demucs.pretrained import get_model; get_model('htdemucs')"

COPY . .

ENTRYPOINT ["python", "worker.py"]
