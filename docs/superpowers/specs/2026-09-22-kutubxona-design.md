# Elektron kutubxona — dizayn spetsifikatsiyasi

Sana: 2026-09-22
Holat: tasdiqlangan

## 1. Maqsad

Real maktab/kollej kutubxonasi uchun veb-tizim: kitoblar katalogi, brauzerda
onlayn o'qish, va kutubxonachi uchun sodda berib-qaytarib olish jurnali.

Foydalanuvchilar:
- **Mehmon** — hamma narsani ko'radi va o'qiydi, login shart emas.
- **Kutubxonachi (staff)** — kitob qo'shadi, toifalarni boshqaradi, jurnal yuritadi.

## 2. Asosiy g'oya: ikki o'qli toifalash

Har bir kitob ikki mustaqil o'q bo'yicha toifalanadi:

1. **Turi (Form)** — kitob nima ekanligi: qo'lyozma, badiiy asar, darslik,
   dissertatsiya, ma'ruzalar to'plami. Bitta kitob = bitta tur.
2. **Yo'nalish (Subject)** — kitob nimani o'rgatishi: kardiologiya, terapiya,
   jarrohlik, anatomiya. Bitta kitob = bir nechta yo'nalish. Ierarxik
   (`ota` maydoni orqali: Ichki kasalliklar > Kardiologiya).

Katalog filtri shu ikki o'q ustiga quriladi.

## 3. Ma'lumot modeli

```
Author       ism, tavsif
Form         nomi_uz/ru/en, slug, tartib
Subject      nomi_uz/ru/en, slug, ota (self FK, null), tartib
Book         nomi, slug, tavsif, nashriyot, yil, til, muqova,
             mualliflar (M2M Author), turi (FK Form), yonalishlar (M2M Subject),
             qoshilgan_sana, korishlar_soni
BookFile     kitob (FK Book), fayl, format (pdf|epub), hajm, tartib
Reader       fish, guruh, telefon, izoh          # login yo'q
LoanEntry    kitob (FK), oquvchi (FK Reader), berilgan_sana, qaytarilgan_sana,
             kutubxonachi (FK User), izoh
```

Qoida: bir kitobning qaytarilmagan yozuvi turganda, o'sha kitobni qayta berib
bo'lmaydi (`clean()` da tekshiriladi).

**Ataylab yo'q:** nusxa soni, shtrix-kod, muddat, jarima, o'quvchi profili,
reyting, izohlar.

## 4. Sahifalar

| URL | Ko'rinish | Kim |
|---|---|---|
| `/` | Bosh sahifa: qidiruv, yangi kitoblar, yo'nalishlar | hamma |
| `/katalog/` | Filtr (tur, yo'nalish, til, yil) + qidiruv, HTMX bilan | hamma |
| `/kitob/<slug>/` | Metama'lumot, muqova, "O'qish" tugmasi | hamma |
| `/kitob/<slug>/oqish/<file_id>/` | PDF.js / epub.js o'quvchi | hamma |
| `/jurnal/` | Berish/qaytarish ro'yxati va formasi | staff |
| `/hisobot/` | Eng ko'p o'qilganlar, yo'nalish statistikasi | staff |
| `/admin/` | Django admin | staff |

Fayl saqlagichdan presigned URL (1 soat) orqali to'g'ridan-to'g'ri
ko'rsatiladi. Yuklab olish tugmasi berilmaydi (texnik to'siq emas).

## 5. Texnologiya

- Python 3.14, Django 6.1
- **Neon PostgreSQL** (bepul, kartasiz) — `DATABASE_URL` orqali
- **S3-mos obyekt saqlagich** fayllar uchun: Supabase Storage (1 GB, kartasiz)
  → keyin Cloudflare R2 (10 GB). Provayder `.env` bilan almashtiriladi
- Tailwind CSS (standalone CLI, Node.js kerak emas) + HTMX
- PDF.js (PDF), epub.js (EPUB) — brauzerda o'qish
- WhiteNoise (statik), Vercel Fluid Compute (bepul Hobby)
- i18n: `uz` (asosiy), `ru`, `en` — URL prefiksi bilan

## 6. Katalog o'lchami

<1000 kitob, <500 o'quvchi. Neon bepul tarifi (0.5 GB) yetarli.
Qidiruv: PostgreSQL `icontains` + indeks; FTS shu hajmda kerak emas.

## 7. Testlar

`pytest-django`:
- Model: `LoanEntry` qaytarilmagan kitobni qayta berishga yo'l qo'ymaydi
- Model: `Subject` ierarxiyasi, `Book` slug avtomatik yaratilishi
- View: katalog filtri tur/yo'nalish bo'yicha to'g'ri kesadi
- View: `/jurnal/` mehmonni kiritmaydi, staff'ni kiritadi
- View: kitob ochilganda `korishlar_soni` oshadi
- i18n: 3 tilda sahifa 200 qaytaradi

## 8. Deploy

GitHub → Vercel (avtomatik). Docker kerak emas.
Batafsil: [ARCHITECTURE.md](../../ARCHITECTURE.md) — bepul stek, uning
cheklovlari va o'sish yo'li shu yerda.

Fayllar Django orqali o'tmaydi: o'qish ham, yuklash ham brauzerdan
to'g'ridan-to'g'ri saqlagichga presigned URL bilan bajariladi.
