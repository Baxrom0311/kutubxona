# Elektron kutubxona — Arxitektura

Sana: 2026-09-22 · Holat: tasdiq kutilmoqda
Bog'liq hujjat: [dizayn spetsifikatsiyasi](superpowers/specs/2026-09-22-kutubxona-design.md)

---

## 0. Asosiy cheklov: maksimal bepul

Bu loyihaning arxitekturasini **funksional talablar emas, byudjet** belgilaydi.
"Bepul" degani quyidagi to'rtta narsadan voz kechish demakdir:

| Yo'qotamiz | Sabab | Nima bilan almashtiramiz |
|---|---|---|
| **Doimiy disk** | Bepul platformalarda disk yo'q yoki har deploy'da o'chadi | Fayllar → tashqi obyekt saqlagich (S3-mos) |
| **SQLite** | Disk yo'q → SQLite fayli saqlanmaydi | Neon PostgreSQL (bepul) |
| **Doim yoqiq server** | Bepul compute uxlaydi | Vercel Fluid (soniyada uyg'onadi), Neon scale-to-zero |
| **Uzoq so'rovlar** | Hobby'da funksiya ~10 soniya | Fayl yuklash brauzerdan to'g'ridan-to'g'ri saqlagichga (presigned URL) |

Shu to'rt qaror butun arxitekturani tushuntiradi.

---

## 1. Tanlangan stek

```
┌──────────────┐     HTML/HTMX      ┌────────────────────────┐
│   Brauzer    │◄──────────────────►│  Vercel (Django 6.1)   │
│ PDF.js/epub.js│                    │  Python 3.12, Fluid    │
└──────┬───────┘                    └───────┬────────────────┘
       │                                    │ SQL (pooled)
       │ PDF/EPUB to'g'ridan-to'g'ri        ▼
       │ (presigned URL, CDN)       ┌────────────────────────┐
       │                            │  Neon PostgreSQL       │
       ▼                            │  0.5 GB, scale-to-zero │
┌──────────────────────┐            └────────────────────────┘
│  S3-mos saqlagich    │
│  Supabase → R2 → B2  │
│  (almashtirsa bo'ladi)│
└──────────────────────┘
```

| Qatlam | Xizmat | Bepul hajm | Karta kerakmi |
|---|---|---|---|
| Compute | **Vercel Hobby** | 100 GB trafik/oy, cheksiz deploy | ❌ yo'q |
| Ma'lumotlar bazasi | **Neon Postgres** | 0.5 GB, 100 compute-soat/oy | ❌ yo'q |
| Fayl saqlash | **Supabase Storage** | 1 GB | ❌ yo'q |
| Fayl saqlash (keyingi bosqich) | **Cloudflare R2** | 10 GB, chiqish trafigi bepul | ✅ ha |

**Umumiy narx: $0/oy.** Domen olsangiz ~$10/yil (`.uz` alohida).

---

## 2. Nega aynan shu — muqobillar bilan solishtirish

### 2.1. Compute

| Variant | Bepulmi | Muammo |
|---|---|---|
| **Vercel Hobby** ✅ | Ha, kartasiz | Funksiya 10 s cheklovi; faqat **notijorat** foydalanish |
| Render Free | Ha, kartasiz | 15 daqiqa harakatsizlikdan keyin uxlaydi, **uyg'onishi ~50 soniya**. O'quvchi sahifani ochsa 1 daqiqa kutadi |
| Fly.io | Qisman | Endi kartasiz ishlamaydi |
| PythonAnywhere Free | Ha | 512 MB disk, o'z domeningiz yo'q, CPU qattiq cheklangan |
| Oracle Always Free VPS | Ha, lekin | 4 yadro/24 GB RAM tekin — **eng kuchlisi**, ammo karta + akkaunt tasdiqlash kerak, O'zbekistondan ochish qiyin |

→ **Vercel**, chunki sovuq start muammosi yo'q va karta so'ramaydi.
Maktab kutubxonasi notijorat — Hobby shartlariga mos.

### 2.2. Ma'lumotlar bazasi

| Variant | Bepulmi | Muammo |
|---|---|---|
| **Neon** ✅ | Ha, kartasiz, **doimiy** | 100 compute-soat/oy |
| Render Postgres Free | Ha | **90 kundan keyin o'chiriladi** — real kutubxona uchun yaroqsiz |
| Supabase Postgres | Ha, kartasiz | 500 MB; 1 hafta harakatsizlikda to'xtaydi |

→ **Neon**. Zaxira variant — Supabase.

### 2.3. Fayl saqlash (PDF/EPUB)

| Variant | Bepul hajm | Karta | Izoh |
|---|---|---|---|
| **Supabase Storage** ✅ | 1 GB | ❌ | Bugun boshlash uchun. ~100–150 PDF |
| **Cloudflare R2** | 10 GB | ✅ | Chiqish trafigi **bepul** — o'qish serveri uchun ideal. ~1000–1500 PDF |
| Backblaze B2 | 10 GB | ✅ | Saqlash arzonroq, lekin trafik cheklangan |
| Internet Archive | cheksiz | ❌ | Faqat **ochiq/mualliflik huquqi ruxsat bergan** kitoblar uchun |
| GitHub Releases | ~cheksiz | ❌ | Fayl ≤2 GB. Ishlaydi, lekin GitHub shartlariga to'liq mos emas |

→ **Bugun Supabase (1 GB) bilan ishga tushiramiz, karta paydo bo'lsa R2 (10 GB) ga o'tamiz.**

**Muhim:** uchalasi ham **S3-mos API**. Shuning uchun kodda bitta
`django-storages` S3 backend ishlatiladi, provayder esa `.env` dagi 4 ta
o'zgaruvchi bilan almashtiriladi. Ko'chish = 4 qator o'zgartirish + fayllarni
`rclone sync` bilan ko'chirish. **Kod umuman o'zgarmaydi.**

---

## 3. Komponentlar

```
config/            — Django sozlamalari, URL, WSGI
catalog/
  models.py        — Author, Form, Subject, Book, BookFile, Reader, LoanEntry
  views.py         — bosh sahifa, katalog, kitob, o'quvchi (reader)
  filters.py       — katalog filtri (tur × yo'nalish × til × yil)
  admin.py         — kutubxonachi paneli
  storage.py       — S3-mos saqlagich + presigned URL generatori
journal/           — berish/qaytarish jurnali (staff)
templates/         — Django shablonlari (HTMX bilan)
static/            — Tailwind CSS chiqishi, PDF.js, epub.js
locale/uz|ru|en/   — tarjimalar
```

Har modul bitta vazifa bajaradi va alohida test qilinadi.
`storage.py` — provayder almashtirishning yagona nuqtasi; qolgan kod S3 haqida
bilmaydi.

---

## 4. Ma'lumot modeli

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

Faylning o'zi bazada saqlanmaydi — faqat `storage_key` (masalan
`books/2026/yurak-kasalliklari.pdf`). Bu provayder almashganda bazani
o'zgartirmaslikka imkon beradi.

**Ataylab yo'q (YAGNI):** nusxa soni, shtrix-kod, muddat, jarima,
o'quvchi profili/login, reyting, izohlar.

---

## 5. Asosiy oqimlar

### 5.1. Katalogni ko'rish
```
Brauzer → Vercel/Django → Neon (SELECT) → HTML
```
Filtr HTMX bilan — faqat ro'yxat qismi yangilanadi, sahifa qayta yuklanmaydi.

### 5.2. Kitobni o'qish  ← eng muhim oqim
```
1. Brauzer  → Django: GET /kitob/<slug>/oqish/<file_id>/
2. Django   → korishlar_soni += 1, presigned URL yaratadi (1 soat amal qiladi)
3. Django   → Brauzer: PDF.js sahifasi + shu URL
4. Brauzer  → Saqlagich (TO'G'RIDAN-TO'G'RI, CDN orqali)
```
**Fayl hech qachon Django orqali o'tmaydi.** Shu sababli:
- Vercel 10 s cheklovi ta'sir qilmaydi
- Vercel trafigi sarflanmaydi
- R2 da chiqish trafigi bepul → 1000 o'quvchi ham xarajat keltirmaydi

### 5.3. Kitob qo'shish (kutubxonachi)
```
1. Admin     → Django: presigned PUT URL so'raydi
2. Brauzer   → Saqlagich: faylni TO'G'RIDAN-TO'G'RI yuklaydi
3. Brauzer   → Django: "yuklandi, key = ..." → BookFile yoziladi
```
Katta PDF Django orqali o'tmagani uchun 10 s cheklovi buzilmaydi.

---

## 6. Ko'p tillilik

- Interfeys matnlari: Django `gettext` → `locale/uz|ru|en/`
- URL prefiksi: `/uz/katalog/`, `/ru/katalog/`, `/en/katalog/`
- Toifa nomlari: `nomi_uz` / `nomi_ru` / `nomi_en` ustunlari.
  Bo'sh bo'lsa o'zbekchaga qaytadi (`nomi()` metodi)
- Kitob nomi tarjima qilinmaydi — qanday kiritilsa shunday qoladi

---

## 7. Bepullikning chegaralari — nima qachon buziladi

| Chegara | Qachon uriladi | Nima qilamiz |
|---|---|---|
| **Neon 100 compute-soat/oy** ⚠️ | Kun bo'yi uzluksiz foydalanishda | Eng ehtimolli muammo. `CONN_MAX_AGE=0` + 5 daq. harakatsizlikda uxlash. Uriladigan bo'lsa → Supabase Postgres (soat cheklovi yo'q) |
| Neon 0.5 GB baza | ~50 000 kitob | Yaqin emas (maqsad <1000) |
| Supabase Storage 1 GB | ~120 PDF | **Birinchi uriladigan chegara.** → R2 (10 GB) |
| Vercel 100 GB trafik | Deyarli hech qachon | Fayllar Vercel orqali o'tmaydi |
| Vercel 10 s funksiya | Og'ir hisobotda | Hisobot sahifasini keshlash |
| Vercel Hobby "notijorat" | Pul ishlay boshlasangiz | Pro ($20/oy) |

**Xulosa:** birinchi to'siq — **saqlash hajmi**, ikkinchisi — **Neon soatlari**.
Ikkalasi ham kod o'zgartirmasdan hal bo'ladi.

---

## 8. Deploy

```
GitHub repo  ──push──►  Vercel (avtomatik build va deploy)
                          │
                          ├── DATABASE_URL     → Neon
                          ├── S3_ENDPOINT/KEY  → Supabase yoki R2
                          └── SECRET_KEY, ALLOWED_HOSTS
```

Qadamlar:
1. Neon'da loyiha ochish → `DATABASE_URL` nusxalash
2. Supabase'da bucket ochish → S3 kalitlarini olish
3. GitHub'ga push
4. Vercel'da repo'ni ulash, env o'zgaruvchilarni kiritish
5. `python manage.py migrate` (bir marta, lokal yoki Vercel build hook'da)
6. `createsuperuser` → kutubxonachi akkaunti

`vercel.json` va `requirements.txt` repo'da bo'ladi. Docker kerak emas.

---

## 9. Testlar

`pytest-django`:
- `LoanEntry` qaytarilmagan kitobni qayta berishga yo'l qo'ymaydi
- `Subject` ierarxiyasi va `nomi()` tilga qarab to'g'ri qaytaradi
- Katalog filtri tur × yo'nalish bo'yicha to'g'ri kesadi
- `/jurnal/` mehmonni kiritmaydi, staff'ni kiritadi
- Kitob ochilganda `korishlar_soni` oshadi
- Presigned URL yaratiladi va muddati bor
- Uchala tilda sahifa 200 qaytaradi

Saqlagich testlarda soxta (fake) backend bilan almashtiriladi — testlar
internetsiz ishlaydi.

---

## 10. Eslatma: mualliflik huquqi

"Hamma ochiq o'qiy oladi" degan qaror tibbiy darsliklar uchun huquqiy savol
tug'diradi. Texnik jihatdan tizim ikkalasini ham qo'llab-quvvatlaydi —
`Book.ochiq` maydoni qo'shilsa, ayrim kitoblarni faqat maktab ichida
ko'rsatish mumkin. Hozircha hammasi ochiq; keraklisini keyin cheklaymiz.
