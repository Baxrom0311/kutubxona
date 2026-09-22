# Elektron kutubxona — Arxitektura

Sana: 2026-09-22 · Versiya 2 (ajratilgan frontend)
Bog'liq: [dizayn spetsifikatsiyasi](superpowers/specs/2026-09-22-kutubxona-design.md)

---

## 0. Asosiy cheklov: maksimal bepul

Arxitekturani funksional talablar emas, **byudjet** belgilaydi. "Bepul" degani
ikkita narsadan voz kechish:

| Yo'qotamiz | Sabab | Almashtiruvchi |
|---|---|---|
| **Ishonchli disk** | Bepul konteyner diski deploy'da yo'qolishi mumkin | Fayllar → tashqi S3-mos saqlagich |
| **Katta baza** | Bepul Postgres kichik | <1000 kitob uchun ortig'i bilan yetarli |

Qolgan hammasi bepul tarifda to'liq ishlaydi.

---

## 1. Stek

```
┌─────────────────────────────┐
│  Vercel — Next.js frontend  │   ochiq katalog, kitob sahifasi,
│  SSR/ISR, next-intl (3 til) │   PDF.js / epub.js o'quvchi
└───────┬─────────────────────┘
        │ REST (faqat o'qish, autentifikatsiyasiz)
        ▼
┌─────────────────────────────┐        ┌──────────────────────┐
│  Northflank — Django + DRF  │───────►│ Northflank Postgres  │
│  always-on, gunicorn        │  SQL   │ bepul addon          │
│  + Django admin (staff)     │        └──────────────────────┘
└───────┬─────────────────────┘
        │ presigned URL beradi (fayl o'zi o'tmaydi)
        ▼
┌─────────────────────────────┐
│  S3-mos saqlagich           │◄──── brauzer PDF'ni TO'G'RIDAN oladi
│  Supabase 1GB → R2 10GB     │
└─────────────────────────────┘
```

| Qatlam | Xizmat | Bepul hajm | Karta |
|---|---|---|---|
| Frontend | **Vercel Hobby** | 100 GB trafik/oy | ❌ |
| Backend | **Northflank Sandbox** | 2 servis, always-on | ⚠️ tekshiriladi |
| Baza | **Northflank Postgres** | 1 bepul addon | ⚠️ |
| Fayllar | **Supabase Storage** | 1 GB (~120 PDF) | ❌ |
| Fayllar (keyin) | **Cloudflare R2** | 10 GB, chiqish bepul | ✅ |

**Narx: $0/oy.**

---

## 2. Nega shu tanlovlar

### 2.1. Backend — Northflank

| Variant | Muammo |
|---|---|
| **Northflank** ✅ | **Uxlamaydi**, vaqt cheklovi yo'q, to'liq konteyner → Django normal ishlaydi |
| Render Free | 15 daq. uxlaydi, uyg'onishi ~50 s. Bepul Postgres 90 kunda o'chadi |
| Vercel Hobby | Serverless, funksiya 10 s, faqat notijorat. Django uchun noqulay |
| Fly.io | Kartasiz ishlamaydi |

### 2.2. Baza — Northflank Postgres (Neon emas)

Neon bepul tarifi **100 compute-soat/oy** beradi. Northflank always-on
bo'lgani uchun baza deyarli hech qachon uxlamaydi → oyiga 730 soat kerak
bo'ladi va baza oy o'rtasida to'xtaydi.

Northflank Postgres shu muammodan xoli: always-on, soat hisobi yo'q, backend
bilan bir tarmoqda (past kechikish). Bepul tarifning 1 ta addon slotini
band qiladi — bu yagona narxi.

Ko'chish kerak bo'lsa `DATABASE_URL` ni almashtirish kifoya.

### 2.3. Fayl saqlash

| Variant | Hajm | Karta | Izoh |
|---|---|---|---|
| **Supabase Storage** ✅ | 1 GB | ❌ | Bugun boshlash uchun |
| **Cloudflare R2** | 10 GB | ✅ | Chiqish trafigi bepul — o'qish serveri uchun ideal |
| Backblaze B2 | 10 GB | ✅ | Trafik cheklangan |
| Internet Archive | cheksiz | ❌ | Faqat ochiq/ruxsat berilgan kitoblar |

Uchalasi **S3-mos**. Kodda bitta `storage.py`, provayder `.env` dagi 4
o'zgaruvchi bilan almashadi. R2'ga ko'chish = 4 qator + `rclone sync`,
**kod o'zgarmaydi**.

---

## 3. Eng muhim qaror: autentifikatsiya yo'q

Siz "hamma ochiq o'qiy oladi" dedingiz. Shuni oxirigacha ishlatamiz:

- **Frontend 100% ochiq, faqat o'qish uchun.** Login yo'q, JWT yo'q,
  sessiya yo'q, CORS'da `credentials` yo'q.
- **Barcha yozish amallari Django admin orqali** (Northflank domenida,
  `/admin/`). Kutubxonachi o'sha yerga kiradi.
- **Jurnal (berish/qaytarish) ham Django admin ichida** — alohida sahifa
  yozilmaydi.

Bu loyihaning eng qimmat qismini (auth + rollar + xavfsizlik) butunlay
yo'q qiladi. 4 haftalik ishning ~1 haftasi shu bilan tejaladi.

Agar keyin o'quvchi login kerak bo'lsa — API'ga JWT qo'shiladi,
frontend o'zgaradi. Hozir emas (YAGNI).

---

## 4. Repo tuzilishi (monorepo)

```
kutubxona/
├── backend/                  → Northflank'ga deploy
│   ├── config/               Django sozlamalari, URL, WSGI
│   ├── catalog/
│   │   ├── models.py         Author, Form, Subject, Book, BookFile,
│   │   │                     Reader, LoanEntry
│   │   ├── serializers.py    DRF
│   │   ├── api.py            faqat o'qish uchun ViewSet'lar
│   │   ├── filters.py        tur × yo'nalish × til × yil
│   │   ├── admin.py          kutubxonachi paneli + jurnal
│   │   └── storage.py        S3-mos saqlagich, presigned URL
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                 → Vercel'ga deploy
│   ├── app/[locale]/         Next.js App Router
│   │   ├── page.tsx          bosh sahifa
│   │   ├── katalog/          filtr + qidiruv
│   │   └── kitob/[slug]/     kitob + o'qish
│   ├── components/
│   ├── lib/api.ts            backend bilan yagona aloqa nuqtasi
│   └── messages/uz|ru|en.json
└── docs/
```

Har modul bitta vazifa bajaradi. `storage.py` — provayder almashtirishning
yagona nuqtasi; `lib/api.ts` — backend URL'ining yagona nuqtasi.

---

## 5. Ma'lumot modeli

```
Author      ism
Form        nomi_uz/ru/en, slug          ← "qo'lyozma", "badiiy asar", "darslik"
Subject     nomi_uz/ru/en, slug, ota     ← "kardiologiya", "terapiya" (ierarxik)

Book        nomi, slug, tavsif, nashriyot, yil, til, muqova_key,
            mualliflar M2M, turi FK→Form, yonalishlar M2M→Subject,
            korishlar_soni, qoshilgan_sana

BookFile    kitob FK, storage_key, format(pdf|epub), hajm, sahifalar_soni

Reader      fish, guruh, telefon         ← login YO'Q
LoanEntry   kitob FK, oquvchi FK, berilgan_sana, qaytarilgan_sana,
            kutubxonachi FK→User, izoh
```

**Qoida:** kitobning qaytarilmagan yozuvi turganda uni qayta berib bo'lmaydi
(`LoanEntry.clean()`).

Fayl bazada saqlanmaydi — faqat `storage_key`
(masalan `books/2026/yurak-kasalliklari.pdf`). Provayder almashganda baza
o'zgarmaydi.

**Ataylab yo'q (YAGNI):** nusxa soni, shtrix-kod, muddat, jarima,
o'quvchi profili/login, reyting, izohlar.

---

## 6. API

Faqat `GET`. Hammasi ochiq.

```
GET /api/kitoblar/?turi=&yonalish=&til=&yil=&q=&sahifa=
GET /api/kitoblar/<slug>/
GET /api/kitoblar/<slug>/oqish/<file_id>/   → {url, amal_qiladi}  presigned
GET /api/turlar/
GET /api/yonalishlar/        → ierarxik daraxt
```

Toifalar uchalasi tilda qaytadi: `{"uz": "...", "ru": "...", "en": "..."}`.
Frontend qaysi kerakligini o'zi tanlaydi — tilni backend bilmaydi.

CORS: faqat Vercel domeni va `localhost:3000`. `credentials` yo'q.

---

## 7. Asosiy oqimlar

### 7.1. Katalog
```
Brauzer → Vercel (SSR) → Northflank API → Postgres → JSON → HTML
```
Filtr o'zgarsa URL o'zgaradi (`?yonalish=kardiologiya`) → SSR qayta render.
Kitob sahifalari ISR bilan keshlanadi → Google indekslaydi.

### 7.2. Kitobni o'qish ← eng muhim oqim
```
1. Brauzer → API:      GET /api/kitoblar/<slug>/oqish/<id>/
2. API     →           korishlar_soni += 1, presigned URL yaratadi (1 soat)
3. API     → Brauzer:  {"url": "https://...", "amal_qiladi": "..."}
4. Brauzer → Saqlagich: PDF'ni TO'G'RIDAN-TO'G'RI oladi (CDN)
```
**Fayl hech qachon Django yoki Vercel orqali o'tmaydi.** Natijada:
- Northflank konteyneri band bo'lmaydi
- Vercel trafigi sarflanmaydi
- R2'da chiqish bepul → 1000 o'quvchi ham 0 so'm

### 7.3. Kitob qo'shish (kutubxonachi, Django admin)
```
1. Admin   → presigned PUT URL so'raydi
2. Brauzer → Saqlagich: faylni TO'G'RIDAN yuklaydi
3. Brauzer → Django: "key = ..." → BookFile yoziladi
```

---

## 8. Ko'p tillilik

- **Frontend:** `next-intl`, URL `/uz/`, `/ru/`, `/en/`. Interfeys matnlari
  `messages/*.json` da
- **Backend:** toifa nomlari uchta ustunda (`nomi_uz/ru/en`), API uchalasini
  qaytaradi. Bo'sh bo'lsa o'zbekchaga qaytadi
- **Django admin** o'zbekcha
- Kitob nomi tarjima qilinmaydi

---

## 9. Bepullikning chegaralari

| Chegara | Qachon uriladi | Nima qilamiz |
|---|---|---|
| **Supabase 1 GB** ⚠️ | ~120 PDF | **Birinchi uriladigan chegara.** → R2 (10 GB) |
| Northflank 2 servis | 3-servis kerak bo'lsa | Frontend Vercel'da — 1 slot bo'sh turadi |
| Northflank 1 addon | Redis kerak bo'lsa | Kesh Django locmem bilan; Redis kerak emas |
| Vercel 100 GB trafik | Deyarli hech qachon | Fayllar Vercel orqali o'tmaydi |
| Vercel Hobby notijorat | Pul ishlasangiz | Pro $20/oy |

**Birinchi to'siq — saqlash hajmi.** Kod o'zgartirmasdan hal bo'ladi.

---

## 10. Testlar

**Backend** (`pytest-django`):
- `LoanEntry` qaytarilmagan kitobni qayta berishga yo'l qo'ymaydi
- `Subject` ierarxiyasi va `nomi()` tilga qarab to'g'ri qaytaradi
- API filtri tur × yo'nalish bo'yicha to'g'ri kesadi
- Kitob ochilganda `korishlar_soni` oshadi
- Presigned URL yaratiladi va muddati bor
- API `POST`/`PUT`/`DELETE` ni rad etadi (faqat o'qish)
- CORS begona domenni kiritmaydi

Saqlagich testlarda soxta backend bilan almashadi — testlar internetsiz ishlaydi.

**Frontend** (Vitest + Playwright):
- Katalog filtri URL'ga yoziladi va qayta yuklanganda saqlanadi
- Uchala tilda sahifa ochiladi
- PDF o'quvchi presigned URL bilan yuklaydi

---

## 11. Deploy

```
GitHub monorepo
   ├── backend/   ──►  Northflank (Dockerfile, root: backend/)
   │                   env: DATABASE_URL, SECRET_KEY, S3_*, CORS_ORIGINS
   └── frontend/  ──►  Vercel (root: frontend/)
                       env: NEXT_PUBLIC_API_URL
```

Qadamlar:
1. Northflank'da servis + Postgres addon yaratish
2. Supabase'da bucket ochish → S3 kalitlari
3. Northflank env'larini kiritish → deploy → `migrate` → `createsuperuser`
4. Vercel'da `frontend/` ni ulash → `NEXT_PUBLIC_API_URL` = Northflank domeni
5. Backend `CORS_ORIGINS` ga Vercel domenini qo'shish

---

## 12. Eslatma: mualliflik huquqi

Tibbiy darsliklarni hamma uchun ochiq qilish huquqiy savol tug'diradi.
Tizim ikkalasini ham qo'llaydi — `Book.ochiq` maydoni qo'shilsa, ayrim
kitoblarni cheklash mumkin. Hozircha hammasi ochiq.
