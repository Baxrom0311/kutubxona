FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
WORKDIR /app

# Tizim paketlari (Postgres mijoz va gcc)
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq-dev gcc postgresql-client && rm -rf /var/lib/apt/lists/*

# Xavfsizlik uchun xavfsiz foydalanuvchi yaratish
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Build jarayonida statik fayllarni yig'ish
RUN python manage.py collectstatic --noinput

# Huquqlarni appuser ga o'tkazish
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 8000

CMD ["gunicorn", "config.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "2", \
     "--timeout", "60", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
