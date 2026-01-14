FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# System deps (important for psycopg)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Collect static files during build
RUN python manage.py collectstatic --noinput

ENTRYPOINT ["sh", "docker/entrypoint.sh"]

CMD ["sh", "docker/start-prod.sh"]
