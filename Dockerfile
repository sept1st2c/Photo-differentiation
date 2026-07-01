# Container for the demo backend only (demo/backend/server.py).
# Build from the project root so it can copy the actual predict.py/features.py/models
# being served -- never a duplicated copy.
#
#   docker build -t recapture-detector .
#   docker run -p 8080:8080 recapture-detector

FROM python:3.11-slim

WORKDIR /app

# opencv needs libgl/libglib even in headless use
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./requirements.txt
COPY demo/backend/requirements.txt ./demo-backend-requirements.txt
RUN pip install --no-cache-dir -r requirements.txt -r demo-backend-requirements.txt

COPY features.py predict.py ./
COPY models/ ./models/
COPY demo/backend/server.py ./demo/backend/server.py

ENV PORT=8080
EXPOSE 8080

CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT} --workers 1 --chdir demo/backend server:app"]
