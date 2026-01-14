#!/bin/sh

PORT=${PORT:-8000}
TRIES=5
SLEEP_TIME=5

echo "🚀 Starting service on port $PORT..."

# ----------------------------
# Check database connection
# ----------------------------
echo "🔌 Checking database connection..."

for i in $(seq 1 $TRIES); do
    python - <<END
import sys
import os
import django

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.db import connections
from django.db.utils import OperationalError

try:
    connections['default'].cursor()
    print("✅ Database connection OK")
    sys.exit(0)
except OperationalError as e:
    print(f"❌ Database connection failed: {e}")
    sys.exit(1)
END

    if [ $? -eq 0 ]; then
        break
    fi

    echo "⏳ Waiting for database... ($i/$TRIES)"
    sleep $SLEEP_TIME

    if [ $i -eq $TRIES ]; then
        echo "❌ Could not connect to database after $TRIES attempts. Exiting."
        exit 1
    fi
done

# ----------------------------
# Start Gunicorn
# ----------------------------
echo "🚀 Database is ready. Starting Gunicorn..."
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:$PORT \
    --workers 3 \
    --threads 2 \
    --timeout 120
