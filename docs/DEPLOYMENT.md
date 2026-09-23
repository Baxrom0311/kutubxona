# Bepul Deploy Rejasi

Oxirgi tekshiruv: 2026-09-23.

Bu loyiha uch qismga ajratib deploy qilinadi:

- Frontend: Vercel Hobby
- Backend: Northflank Sandbox
- Database: Northflank PostgreSQL addon
- Fayllar: Cloudflare R2 Standard storage

## 1. Hisoblar

Kerak bo'ladi:

- GitHub repo
- Vercel account
- Northflank account
- Cloudflare account va R2 yoqilgan account
- DeepSeek API key, agar AI chat ishlatilsa

R2 bepul boshlanadi, lekin Cloudflare odatda billing/payment method so'rashi mumkin. Karta bo'lmasa, avval `SAQLAGICH=catalog.storage.SoxtaSaqlagich` bilan backendni ishga tushirib, PDF fayllarni keyin R2ga ulash mumkin.

## 2. Cloudflare R2

R2 ichida ikkita bucket yaratiladi:

- `kutubxona-kitoblar` - private, PDF/EPUB fayllar uchun
- `kutubxona-muqovalar` - public yoki custom/public domain ulangan, muqovalar uchun

Kerakli qiymatlar:

```env
S3_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
S3_REGION=auto
S3_ACCESS_KEY=<r2_access_key>
S3_SECRET_KEY=<r2_secret_key>
S3_BUCKET_KITOBLAR=kutubxona-kitoblar
S3_BUCKET_MUQOVALAR=kutubxona-muqovalar
S3_OCHIQ_DOMEN=https://<public-covers-domain>
SAQLAGICH=catalog.storage.R2Saqlagich
```

## 3. Northflank Backend

### 3.1. PostgreSQL addon

Northflank project ichida PostgreSQL addon yarating. Addon secretlaridan backend servicega connection string beriladi.

Loyiha `DATABASE_URL` nomli env kutadi. Northflank `POSTGRES_URI` bersa, uni `DATABASE_URL` alias sifatida ulang.

### 3.2. Backend service

Northflank service sozlamalari:

- Source: GitHub repo
- Root directory: `backend`
- Build type: Dockerfile
- Dockerfile: `Dockerfile`
- Port: `8000`
- Health check path: `/healthz`

Runtime environment variables:

```env
SECRET_KEY=<kuchli-production-secret>
DEBUG=False
ALLOWED_HOSTS=<northflank-service-domain>,localhost,127.0.0.1
CSRF_TRUSTED_ORIGINS=https://<northflank-service-domain>
CORS_ALLOWED_ORIGINS=https://<vercel-domain>
DATABASE_URL=<northflank-postgres-uri>
CONN_MAX_AGE=60

S3_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
S3_REGION=auto
S3_ACCESS_KEY=<r2_access_key>
S3_SECRET_KEY=<r2_secret_key>
S3_BUCKET_KITOBLAR=kutubxona-kitoblar
S3_BUCKET_MUQOVALAR=kutubxona-muqovalar
S3_OCHIQ_DOMEN=https://<public-covers-domain>
SAQLAGICH=catalog.storage.R2Saqlagich

DEEPSEEK_API_KEY=<deepseek_api_key>
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat

SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True

AXES_FAILURE_LIMIT=5
AXES_COOLOFF_TIME=1
LOG_LEVEL=INFO
```

Konteyner start bo'lganda `entrypoint.sh` avtomatik `python manage.py migrate --noinput` ishlatadi, keyin `gunicorn` start qiladi.

### 3.3. Admin user yaratish

Northflank terminal yoki one-off job orqali:

```bash
python manage.py createsuperuser
```

## 4. Vercel Frontend

Vercel project sozlamalari:

- Framework preset: Next.js
- Root directory: `frontend`
- Install command: `npm ci`
- Build command: `npm run build`
- Output: Next.js default

Environment variables:

```env
NEXT_PUBLIC_API_URL=https://<northflank-service-domain>/api
```

Backend domen aniq bo'lgandan keyin Northflankdagi `CORS_ALLOWED_ORIGINS` va `CSRF_TRUSTED_ORIGINS` qiymatlarini Vercel production domeniga moslab yangilang.

## 5. Deploy Tartibi

1. R2 bucketlarni yarating va API token oling.
2. Northflank PostgreSQL addon yarating.
3. Northflank backend service yarating, envlarni kiriting, deploy qiling.
4. Backend health checkni tekshiring:

```bash
curl https://<northflank-service-domain>/healthz
```

5. Admin user yarating.
6. Vercel frontend project yarating va `NEXT_PUBLIC_API_URL` kiriting.
7. Vercel domenini Northflank `CORS_ALLOWED_ORIGINS` ga qo'shing.
8. Admin orqali turlar, yo'nalishlar, kitoblar va fayllarni kiriting.

## 6. Tezkor Tekshiruv

Backend:

```bash
curl https://<northflank-service-domain>/api/turlar/
curl https://<northflank-service-domain>/api/yonalishlar/
curl https://<northflank-service-domain>/api/kitoblar/
```

Frontend:

```bash
curl -I https://<vercel-domain>
```

## 7. Bepul Limitlar

Hozirgi rasmiy sahifalarga ko'ra:

- Northflank Sandbox: 2 ta bepul service, 1 ta bepul database, always-on compute.
- Cloudflare R2: Standard storage uchun 10 GB-month, 1M Class A, 10M Class B, internetga egress bepul.
- Vercel Hobby: shaxsiy/personal projectlar uchun bepul frontend hosting.

PDF/EPUB fayllar R2dan bevosita o'qiladi, shuning uchun backend katta fayllarni proxy qilmaydi va Northflank trafik/RAM bosimi kamayadi.

