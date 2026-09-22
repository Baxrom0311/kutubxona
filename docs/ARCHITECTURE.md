# Elektron kutubxona — Arxitektura

| | |
|---|---|
| **Sana** | 2026-09-22 |
| **Versiya** | 3 (ajratilgan frontend + R2 saqlagich) |
| **Holat** | tasdiqlangan, implementatsiya boshlandi |
| **Bog'liq** | [dizayn spetsifikatsiyasi](superpowers/specs/2026-09-22-kutubxona-design.md) |

---

## 1. Qisqacha xulosa

Maktab/kollej kutubxonasi uchun veb-tizim. Kitoblar ikki mustaqil o'q bo'yicha
toifalanadi (**turi** va **yo'nalishi**), katalog hamma uchun ochiq, PDF/EPUB
brauzerda o'qiladi, kutubxonachi Django admin orqali boshqaradi.

```
Vercel (Next.js)  ──►  Northflank (Django + DRF)  ──►  Northflank Postgres
       │                        │
       │                        └── presigned URL beradi
       ▼                                  │
Cloudflare R2  ◄──────────────────────────┘
(brauzer PDF'ni to'g'ridan oladi)
```

**Oylik narx: $0.** Yagona pullik ehtimol — domen (~$10/yil).

**Asosiy raqamlar:** <1000 kitob, <500 o'quvchi, 10 GB fayl, 3 til.

---

## 2. Qarorlar jurnali

Har bir qaror nima uchun qabul qilinganini yozib qo'yamiz — 6 oydan keyin
"nega shunday qilgan edik?" degan savol tug'ilmasligi uchun.

| № | Qaror | Sabab | Alternativa nega rad etildi |
|---|---|---|---|
| 1 | **Backend Northflank'da** | Always-on, vaqt cheklovi yo'q, to'liq konteyner | Render 15 daq. uxlaydi (uyg'onishi ~50 s); Vercel'da funksiya 10 s va faqat notijorat |
| 2 | **Postgres Northflank'da** | Soat hisobi yo'q, backend bilan bir tarmoqda | Neon bepul tarifi 100 compute-soat/oy; always-on backend bilan oyiga 730 soat kerak → oy o'rtasida to'xtaydi |
| 3 | **Frontend alohida (Next.js + Vercel)** | Foydalanuvchi tanlovi: UI erkinligi, alohida yangilash | Django templates soddaroq edi, lekin tanlov qilindi |
| 4 | **Autentifikatsiya YO'Q** | Katalog hamma uchun ochiq; yozish faqat Django admin'da | JWT/sessiya loyihaning eng qimmat qismi bo'lardi — talab yo'q ekan, qo'shilmaydi |
| 5 | **Fayllar R2'da** | Chiqish trafigi **shartsiz bepul**, CDN ichida, presigned URL bor | B2'da chiqish saqlangan hajmning 3x bilan cheklangan → o'qish serveri uchun xavfli. Supabase 1 GB — kichik |
| 6 | **Zaxira nusxa B2'da** | Arxiv uchun arzonroq, alohida vendor = alohida xavf nuqtasi | Bir vendorda saqlash zaxiraning ma'nosini kamaytiradi |
| 7 | **Fayl Django orqali o'tmaydi** | Konteyner band bo'lmaydi, trafik sarflanmaydi | Proxy qilish 10 MB PDF uchun 512 MB RAM'ni yeydi |
| 8 | **S3 adapteri abstraksiya orqali** | Provayder almashishi kod o'zgartirmasin | Bevosita boto3 chaqiruvlari kodga tarqalib ketardi |
| 9 | **Ikki bucket: ochiq + yopiq** | Muqovalar keshlansin, kitoblar presigned bo'lsin | Bitta bucket'da muqovalarni ham presigning kerak bo'lardi → Next.js Image keshlamaydi |
| 10 | **Monorepo** | Bitta PR ikkalasini o'zgartiradi, versiyalar mos qoladi | Ikki repo'da API shartnomasi og'ib ketadi |

---

## 3. Xizmatlar va bepul tariflar

| Qatlam | Xizmat | Bepul hajm | Karta | Uxlaydimi |
|---|---|---|---|---|
| Frontend | Vercel Hobby | 100 GB trafik/oy | ❌ | Yo'q |
| Backend | Northflank Sandbox | 2 servis, 2 cron | ⚠️ tekshirish kerak | **Yo'q** |
| Baza | Northflank Postgres | 1 bepul addon | ⚠️ | Yo'q |
| Fayllar | Cloudflare R2 | 10 GB, 1M yozish, 10M o'qish/oy | ✅ ha | — |
| Zaxira | Backblaze B2 | 10 GB | ✅ ha | — |

### 3.1. Nima uchun R2 (B2 emas)

| | R2 | B2 |
|---|---|---|
| Bepul saqlash | 10 GB | 10 GB |
| **Chiqish trafigi** | **cheksiz bepul** | saqlangan hajmning 3x, keyin $0.01/GB |
| CDN | Cloudflare ichida | faqat Bandwidth Alliance orqali (qo'shimcha sozlash) |
| Presigned URL | ✅ SigV4 | ✅ SigV4 |
| boto3 | ✅ | ✅ |

Hisob: 20 MB darslikni bir o'qish = 20 MB trafik. B2'da 10 GB saqlasangiz
oyiga ~30 GB bepul = ~1500 o'qish = kuniga ~50. 500 o'quvchili kollejda
tez tugaydi. R2'da bu cheklov yo'q.

### 3.2. Xavf: R2 karta so'raydi

R2'ni yoqish uchun Cloudflare karta bog'lashni talab qiladi (bepul tarifda
ham). Karta bo'lmasa — **Supabase Storage** (1 GB, kartasiz) bilan boshlash
mumkin, u ham S3-mos. Kod o'zgarmaydi, faqat `.env`.

---

## 4. Repo tuzilishi

```
kutubxona/
├── backend/                       → Northflank
│   ├── config/
│   │   ├── settings.py            env orqali sozlanadi
│   │   ├── urls.py                /api/, /admin/, /healthz
│   │   └── wsgi.py
│   ├── catalog/
│   │   ├── models.py              7 model
│   │   ├── slugs.py               o'zbekcha transliteratsiya
│   │   ├── storage.py             S3 adapter + presigned URL
│   │   ├── serializers.py         DRF
│   │   ├── api.py                 ReadOnlyModelViewSet'lar
│   │   ├── filters.py             tur × yo'nalish × til × yil × qidiruv
│   │   ├── admin.py               kutubxonachi paneli + jurnal
│   │   └── migrations/
│   ├── tests/
│   │   ├── conftest.py            fixtures
│   │   ├── test_models.py
│   │   ├── test_api.py
│   │   ├── test_storage.py        soxta S3 bilan
│   │   └── test_admin.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── pytest.ini
│
├── frontend/                      → Vercel
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx         next-intl provider, header/footer
│   │   │   ├── page.tsx           bosh sahifa
│   │   │   ├── katalog/page.tsx   filtr + qidiruv (SSR)
│   │   │   ├── kitob/[slug]/
│   │   │   │   ├── page.tsx       kitob sahifasi (ISR)
│   │   │   │   └── oqish/[id]/    o'quvchi (client)
│   │   │   ├── error.tsx
│   │   │   └── not-found.tsx
│   │   └── sitemap.ts
│   ├── components/
│   │   ├── KitobKartochka.tsx
│   │   ├── Filtr.tsx
│   │   ├── PdfOquvchi.tsx         pdfjs-dist
│   │   └── EpubOquvchi.tsx        epubjs
│   ├── lib/
│   │   ├── api.ts                 backend bilan YAGONA aloqa nuqtasi
│   │   └── types.ts               API tiplari
│   ├── messages/{uz,ru,en}.json
│   └── i18n.ts
│
└── docs/
    ├── ARCHITECTURE.md            ← shu fayl
    └── superpowers/specs/
```

**Modullik qoidasi:** `storage.py` — saqlagich haqidagi yagona bilim nuqtasi;
`lib/api.ts` — backend manzili haqidagi yagona bilim nuqtasi. Qolgan kod
ularning ichini bilmaydi.

---

## 5. Ma'lumot modeli

### 5.1. Diagramma

```
Author ─────M2M─────┐
                    │
Form ────FK────► Book ────1:N────► BookFile
                    │  ▲
Subject ──M2M───────┘  │
  │ (ota: self FK)     │ FK
  └─ierarxiya          │
                   LoanEntry ────FK────► Reader
                       │
                       └──FK──► User (kutubxonachi)
```

### 5.2. Maydonlar

**`Author` — muallif**

| Maydon | Tip | Izoh |
|---|---|---|
| `ism` | `CharField(200)` | indeks, qidiruv uchun |
| `tavsif` | `TextField(blank)` | ixtiyoriy |

**`Form` — kitob turi** (qo'lyozma, badiiy asar, darslik, dissertatsiya)

| Maydon | Tip | Izoh |
|---|---|---|
| `nomi_uz` | `CharField(100)` | majburiy |
| `nomi_ru` | `CharField(100, blank)` | bo'sh bo'lsa uz'ga qaytadi |
| `nomi_en` | `CharField(100, blank)` | |
| `slug` | `SlugField(unique)` | URL va API filtri uchun |
| `tartib` | `PositiveSmallIntegerField(0)` | ro'yxatdagi tartib |

**`Subject` — yo'nalish** (kardiologiya, terapiya, jarrohlik)

`Form` bilan bir xil maydonlar, ustiga:

| Maydon | Tip | Izoh |
|---|---|---|
| `ota` | `FK(self, null, related_name="bolalar")` | ierarxiya: Ichki kasalliklar → Kardiologiya |

Metod: `toliq_nomi()` → `"Ichki kasalliklar → Kardiologiya"`

**`Book` — kitob**

| Maydon | Tip | Izoh |
|---|---|---|
| `nomi` | `CharField(300)` | indeks |
| `slug` | `SlugField(300, unique)` | avtomatik, o'zbekcha translit |
| `tavsif` | `TextField(blank)` | |
| `nashriyot` | `CharField(200, blank)` | |
| `yil` | `PositiveSmallIntegerField(null)` | |
| `til` | `CharField(5, choices)` | `uz`/`ru`/`en` |
| `muqova_key` | `CharField(500, blank)` | ochiq bucket'dagi kalit |
| `mualliflar` | `M2M(Author, blank)` | |
| `turi` | `FK(Form, PROTECT)` | **bitta** tur |
| `yonalishlar` | `M2M(Subject, blank)` | **bir nechta** yo'nalish |
| `korishlar_soni` | `PositiveIntegerField(0)` | `F()` bilan oshiriladi |
| `qoshilgan_sana` | `DateTimeField(auto_now_add)` | indeks, saralash uchun |

Indekslar: `slug` (unique), `nomi`, `qoshilgan_sana`, `(turi, til)` kompozit.

**`BookFile` — kitob fayli**

| Maydon | Tip | Izoh |
|---|---|---|
| `kitob` | `FK(Book, CASCADE, related_name="fayllar")` | |
| `storage_key` | `CharField(500)` | `kitoblar/2026/<slug>.pdf` |
| `format` | `CharField(10, choices)` | `pdf` / `epub` |
| `hajm` | `PositiveBigIntegerField` | bayt |
| `sahifalar_soni` | `PositiveIntegerField(null)` | PDF uchun |
| `tartib` | `PositiveSmallIntegerField(0)` | |

Bir kitobda bir nechta fayl bo'lishi mumkin (PDF + EPUB).

**`Reader` — o'quvchi** (login YO'Q, faqat jurnal uchun ro'yxat)

| Maydon | Tip |
|---|---|
| `fish` | `CharField(200)`, indeks |
| `guruh` | `CharField(50, blank)` |
| `telefon` | `CharField(20, blank)` |
| `izoh` | `TextField(blank)` |

**`LoanEntry` — jurnal yozuvi**

| Maydon | Tip | Izoh |
|---|---|---|
| `kitob` | `FK(Book, PROTECT)` | |
| `oquvchi` | `FK(Reader, PROTECT)` | |
| `berilgan_sana` | `DateTimeField(auto_now_add)` | |
| `qaytarilgan_sana` | `DateTimeField(null, blank)` | `null` = hali qaytarilmagan |
| `kutubxonachi` | `FK(User, PROTECT)` | kim bergani |
| `izoh` | `TextField(blank)` | |

**Muddat va jarima maydonlari ataylab yo'q.**

### 5.3. Biznes qoidalari (modelda majburlanadi)

1. **Ikki marta berib bo'lmaydi.** `LoanEntry.clean()`: shu kitobning
   `qaytarilgan_sana IS NULL` yozuvi bo'lsa → `ValidationError`.
2. **`slug` avtomatik va unikal.** Bir xil nomli ikki kitob → `-2`, `-3`.
3. **`Form` o'chirilmaydi**, agar unga bog'langan kitob bo'lsa (`PROTECT`).
4. **`Subject` o'zining otasi bo'la olmaydi** — `clean()` da tekshiriladi.
5. **`korishlar_soni`** faqat `F("korishlar_soni") + 1` bilan oshiriladi
   (parallel so'rovlarda hisob yo'qolmasligi uchun).

### 5.4. O'zbekcha slug

Django'ning standart `slugify` `o'` va `g'` ni buzadi
(`"Yurak qon-tomir"` → `"yurak-qon-tomir"` to'g'ri, lekin
`"O'zbek tili"` → `"ozbek-tili"` — apostrof yo'qoladi, bu qabul qilinadi;
muammo kirill harflarda). `catalog/slugs.py`:

```python
TRANSLIT = {
    "'": "", "ʻ": "", "ʼ": "", "‘": "", "’": "",
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e",
    "ё": "yo", "ж": "j", "з": "z", "и": "i", "й": "y", "к": "k",
    "л": "l", "м": "m", "н": "n", "о": "o", "п": "p", "р": "r",
    "с": "s", "т": "t", "у": "u", "ф": "f", "х": "x", "ц": "ts",
    "ч": "ch", "ш": "sh", "щ": "sh", "ъ": "", "ы": "i", "ь": "",
    "э": "e", "ю": "yu", "я": "ya", "ў": "o", "қ": "q", "ғ": "g",
    "ҳ": "h",
}
```

Kirill nomli kitob ham o'qiladigan URL oladi:
`"Кардиология"` → `/kitob/kardiologiya/`

---

## 6. Fayl saqlash qatlami

### 6.1. Ikki bucket

| Bucket | Kirish | Nima saqlanadi | Nega |
|---|---|---|---|
| `kutubxona-muqovalar` | **ochiq** | muqova rasmlari | Next.js Image keshlasin, har safar presigning kerak emas |
| `kutubxona-kitoblar` | **yopiq** | PDF / EPUB | Faqat presigned URL bilan, ommaviy indekslanmasin |

### 6.2. Kalit nomlash

```
kitoblar/<yil>/<slug>.<format>        kitoblar/2026/yurak-kasalliklari.pdf
muqovalar/<yil>/<slug>.webp           muqovalar/2026/yurak-kasalliklari.webp
zaxira/<YYYY-MM-DD>.sql.gz            zaxira/2026-09-22.sql.gz
```

Yil bo'yicha bo'linish — bitta papkada minglab fayl to'planmasligi uchun.

### 6.3. `storage.py` shartnomasi

```python
class Saqlagich:
    def oqish_url(self, key: str, muddat: int = 7200) -> str:
        """Presigned GET URL. Standart 2 soat."""

    def yuklash_url(self, key: str, content_type: str,
                    muddat: int = 900) -> str:
        """Presigned PUT URL. 15 daqiqa — admin yuklashi uchun yetarli."""

    def ochiq_url(self, key: str) -> str:
        """Ochiq bucket uchun oddiy URL, imzosiz."""

    def ochirish(self, key: str) -> None: ...
    def mavjudmi(self, key: str) -> bool: ...
    def hajm(self, key: str) -> int: ...
```

Ikkita amalga oshirish:
- `R2Saqlagich(Saqlagich)` — boto3, `endpoint_url` + `addressing_style="path"`
- `SoxtaSaqlagich(Saqlagich)` — testlar uchun, xotirada, internetsiz ishlaydi

Testlarda `settings.SAQLAGICH = "catalog.storage.SoxtaSaqlagich"`.

### 6.4. Provayderni almashtirish

Faqat `.env` o'zgaradi:

```bash
# Cloudflare R2
S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com
S3_REGION=auto

# Supabase (kartasiz variant)
S3_ENDPOINT=https://<project>.supabase.co/storage/v1/s3
S3_REGION=us-east-1

# Backblaze B2
S3_ENDPOINT=https://s3.us-west-004.backblazeb2.com
S3_REGION=us-west-004
```

Fayllarni ko'chirish: `rclone sync r2:kutubxona-kitoblar b2:kutubxona-kitoblar`

### 6.5. CORS — e'tibor bering

PDF.js faylni **boshqa domendan** oladi, shuning uchun R2 bucket'ida CORS
sozlanishi **shart**, aks holda brauzer bloklaydi:

```json
[{
  "AllowedOrigins": ["https://kutubxona.vercel.app", "http://localhost:3000"],
  "AllowedMethods": ["GET", "HEAD", "PUT"],
  "AllowedHeaders": ["*"],
  "ExposeHeaders": ["Content-Length", "Content-Range", "Accept-Ranges"],
  "MaxAgeSeconds": 3600
}]
```

`Content-Range` va `Accept-Ranges` majburiy — PDF.js katta faylni
bo'lak-bo'lak (range request) o'qiydi. Ular bo'lmasa PDF.js butun 50 MB
faylni yuklab olishga urinadi.

---

## 7. API shartnomasi

Barcha endpoint'lar **faqat `GET`**, autentifikatsiyasiz.
Prefiks: `https://<northflank-domen>/api/`

### 7.1. Kitoblar ro'yxati

```
GET /api/kitoblar/?turi=darslik&yonalish=kardiologiya&til=uz
                  &yil_dan=2020&yil_gacha=2026&q=yurak
                  &saralash=-qoshilgan_sana&sahifa=1
```

| Parametr | Izoh |
|---|---|
| `turi` | `Form.slug` |
| `yonalish` | `Subject.slug` — **ierarxik**: `ichki-kasalliklar` bersangiz bolalari ham qaytadi |
| `til` | `uz` / `ru` / `en` |
| `yil_dan`, `yil_gacha` | oraliq |
| `q` | kitob nomi yoki muallif ismi bo'yicha qidiruv |
| `saralash` | `-qoshilgan_sana` (standart), `nomi`, `-korishlar_soni` |
| `sahifa` | sahifalash, 24 ta/sahifa |

Javob:

```json
{
  "soni": 137,
  "keyingi": "/api/kitoblar/?sahifa=2",
  "oldingi": null,
  "natijalar": [
    {
      "slug": "yurak-kasalliklari-asoslari",
      "nomi": "Yurak kasalliklari asoslari",
      "mualliflar": ["Abu Ali ibn Sino"],
      "turi": {"slug": "darslik",
               "nomi": {"uz": "Darslik", "ru": "Учебник", "en": "Textbook"}},
      "yonalishlar": [
        {"slug": "kardiologiya",
         "nomi": {"uz": "Kardiologiya", "ru": "Кардиология", "en": "Cardiology"}}
      ],
      "yil": 2024,
      "til": "uz",
      "muqova": "https://muqovalar.../yurak-kasalliklari.webp",
      "formatlar": ["pdf", "epub"],
      "korishlar_soni": 412
    }
  ]
}
```

### 7.2. Bitta kitob

```
GET /api/kitoblar/<slug>/
```

Ro'yxatdagi maydonlar + `tavsif`, `nashriyot`, `qoshilgan_sana`, va:

```json
"fayllar": [
  {"id": 12, "format": "pdf", "hajm": 18432000, "sahifalar_soni": 340},
  {"id": 13, "format": "epub", "hajm": 2100000, "sahifalar_soni": null}
]
```

⚠️ **Fayl URL'i bu yerda qaytmaydi** — alohida so'rov bilan olinadi, chunki
presigned URL muddatli va uni keshlash mumkin emas.

### 7.3. O'qish uchun URL

```
GET /api/kitoblar/<slug>/oqish/<fayl_id>/
```

```json
{
  "url": "https://<account>.r2.cloudflarestorage.com/...?X-Amz-Signature=...",
  "format": "pdf",
  "amal_qiladi": "2026-09-22T15:30:00Z"
}
```

Yon ta'sir: `korishlar_soni += 1`.

**Throttling:** `60/soat` bir IP uchun — kutubxonani ommaviy ko'chirib
olishga (scraping) qarshi. Oddiy o'quvchi kuniga 5-10 kitob ochadi.

### 7.4. Toifalar

```
GET /api/turlar/
GET /api/yonalishlar/           → ierarxik daraxt, bolalari ichida
```

```json
[
  {
    "slug": "ichki-kasalliklar",
    "nomi": {"uz": "Ichki kasalliklar", "ru": "...", "en": "..."},
    "kitoblar_soni": 84,
    "bolalar": [
      {"slug": "kardiologiya", "nomi": {...}, "kitoblar_soni": 31, "bolalar": []}
    ]
  }
]
```

`kitoblar_soni` — bolalari bilan **jami**, filtrda foydali.

### 7.5. Til haqida muhim qaror

**Backend tilni bilmaydi.** Toifa nomlari har doim uchala tilda qaytadi,
frontend keraklisini tanlaydi. Sabab:

- API javobi tilga bog'liq bo'lmaydi → CDN'da bir marta keshlanadi
- `Accept-Language` yoki `?til=` parametri kerak emas
- Frontend'da til almashtirish **qayta so'rovsiz** ishlaydi

Narxi: javob ~15% kattaroq. Bu hajmda ahamiyatsiz.

### 7.6. Xatoliklar

| Kod | Qachon | Javob |
|---|---|---|
| 404 | kitob/fayl topilmadi | `{"xato": "Kitob topilmadi"}` |
| 400 | filtr qiymati xato | `{"xato": "...", "maydon": "yil_dan"}` |
| 429 | throttle | `{"xato": "Juda ko'p so'rov", "keyin": 3600}` |
| 503 | saqlagich javob bermadi | `{"xato": "Fayl vaqtincha mavjud emas"}` |

Frontend 503'ni alohida ko'rsatadi: "Fayl vaqtincha ochilmadi, keyinroq
urinib ko'ring" — bu baza emas, saqlagich muammosi.

---

## 8. Asosiy oqimlar

### 8.1. Katalogni ko'rish

```
1. Brauzer → Vercel:      GET /uz/katalog?yonalish=kardiologiya
2. Vercel  → Northflank:  GET /api/kitoblar/?yonalish=kardiologiya
3. Django  → Postgres:    SELECT ... JOIN ... WHERE subject IN (daraxt)
4. Vercel  → Brauzer:     to'liq HTML (SSR)
```

Filtr o'zgarsa URL o'zgaradi → SSR qayta render. Natijada filtr holati
havolada saqlanadi, o'quvchi uni ulashishi mumkin.

### 8.2. Kitobni o'qish ← eng muhim oqim

```
1. Brauzer → Vercel:      GET /uz/kitob/<slug>/oqish/12
2. Vercel  → Brauzer:     o'quvchi sahifasi (client component)
3. Brauzer → Northflank:  GET /api/kitoblar/<slug>/oqish/12/
4. Django  →              korishlar_soni += 1; presigned URL (2 soat)
5. Django  → Brauzer:     {"url": "...", "amal_qiladi": "..."}
6. Brauzer → R2:          PDF'ni range request'lar bilan TO'G'RIDAN oladi
```

**Fayl na Django, na Vercel orqali o'tmaydi.** Natijalari:

| | |
|---|---|
| Northflank RAM | 50 MB PDF konteynerga yuklanmaydi |
| Vercel trafigi | sarflanmaydi (100 GB limitga tegmaydi) |
| R2 chiqish trafigi | **bepul** → 1000 o'quvchi ham $0 |
| Tezlik | Cloudflare CDN, o'quvchiga eng yaqin nuqtadan |

### 8.3. Kitob qo'shish (kutubxonachi)

```
1. Kutubxonachi → /admin/catalog/book/add/ → forma to'ldiradi
2. Fayl tanlaydi → admin JS backend'dan presigned PUT URL so'raydi
3. Brauzer → R2: faylni TO'G'RIDAN yuklaydi (progress bar bilan)
4. Brauzer → Django: {"key": "kitoblar/2026/...", "hajm": 18432000}
5. Django: BookFile yozuvi yaratadi
```

Katta PDF Django orqali o'tmagani uchun konteyner 512 MB RAM'da ham
bemalol ishlaydi.

### 8.4. Jurnal (berish/qaytarish)

Django admin ichida, `LoanEntry` admin'i:

- **Berish:** yangi yozuv → kitob + o'quvchi tanlanadi.
  `clean()` kitob allaqachon kimdaligini tekshiradi → xato beradi.
- **Qaytarish:** ro'yxatdan belgilanadi → admin action
  "Qaytarilgan deb belgilash" → `qaytarilgan_sana = now()`.
- **Filtr:** "faqat qaytarilmaganlar" — kutubxonachining asosiy ekrani.

---

## 9. Frontend arxitekturasi

### 9.1. Render strategiyasi

| Sahifa | Strategiya | Nega |
|---|---|---|
| Bosh sahifa | ISR, 1 soat | Kamdan-kam o'zgaradi, Google indekslaydi |
| Katalog | SSR | `searchParams` har xil, keshlash foydasiz |
| Kitob sahifasi | ISR, 1 soat | **Eng muhim SEO sahifasi**, statik keshlanadi |
| O'quvchi | Client | PDF.js brauzerda ishlaydi |

`generateStaticParams` bilan mashhur 100 kitob build'da oldindan
yaratiladi — qolganlari birinchi so'rovda.

### 9.2. O'quvchi komponentlari

**PDF** — `pdfjs-dist`:
- Worker alohida thread'da, UI muzlamaydi
- Range request → 340 sahifali kitobning faqat ko'rinayotgan qismi yuklanadi
- Sahifa raqami `localStorage`'da saqlanadi → keyingi safar o'sha joydan davom
- Zoom, to'liq ekran, sahifaga o'tish

**EPUB** — `epubjs`:
- Matn qayta oqadi (reflow), telefonda o'qish qulay
- Shrift o'lchami sozlanadi
- Joyi (CFI) `localStorage`'da

### 9.3. `lib/api.ts` — yagona aloqa nuqtasi

```typescript
const ASOS = process.env.NEXT_PUBLIC_API_URL!;

export async function kitoblarniOlish(params: KatalogFiltri): Promise<Sahifa<Kitob>>
export async function kitobniOlish(slug: string): Promise<KitobToliq>
export async function oqishUrlOlish(slug: string, faylId: number): Promise<OqishJavobi>
export async function turlarniOlish(): Promise<Turi[]>
export async function yonalishlarniOlish(): Promise<Yonalish[]>
```

Butun frontend'da `fetch` faqat shu faylda. Backend manzili o'zgarsa —
bitta fayl o'zgaradi.

---

## 10. Ko'p tillilik

| Qatlam | Yechim |
|---|---|
| Frontend interfeys | `next-intl`, `messages/{uz,ru,en}.json` |
| URL | `/uz/katalog`, `/ru/katalog`, `/en/katalog` |
| Standart til | `uz` (prefiks ko'rinadi, `/` → `/uz` redirect) |
| Toifa nomlari | Bazada 3 ustun; bo'sh bo'lsa `uz`'ga qaytadi |
| Kitob nomi | **Tarjima qilinmaydi** — qanday kiritilsa shunday |
| Django admin | O'zbekcha (`LANGUAGE_CODE = "uz"`) |
| Sana/vaqt | `Asia/Tashkent`, har til uchun o'z formati |

`nomi()` metodi:

```python
def nomi(self, til: str = "uz") -> str:
    return getattr(self, f"nomi_{til}", "") or self.nomi_uz
```

---

## 11. Xavfsizlik

| Xavf | Chora |
|---|---|
| Ommaviy ko'chirib olish (scraping) | Presign endpoint'ga `60/soat` throttle |
| Kitoblar Google'da indekslanishi | Yopiq bucket + presigned URL (2 soat) |
| Admin panelga hujum | Kuchli parol, `django-axes` (login urinishlari cheklovi) |
| CSRF | `CSRF_TRUSTED_ORIGINS` = Northflank domeni |
| HTTPS orqasida ishlash | `SECURE_PROXY_SSL_HEADER`, `SECURE_SSL_REDIRECT` |
| Begona domendan API | `CORS_ALLOWED_ORIGINS` = faqat Vercel + localhost. `credentials` YO'Q |
| SQL injection | Django ORM, xom SQL yozilmaydi |
| Fayl turi aldanishi | Faqat `pdf`/`epub`, `Content-Type` presign'da qat'iy belgilanadi |
| Sirlar kodda qolishi | Hammasi env'da, `.env` gitignore'da |

**Auth yo'qligi xavf emas** — yozish amallarining hammasi Django admin
ortida, u esa alohida domenda va sessiya bilan himoyalangan.

---

## 12. Zaxira nusxa

Bepul tarifda **avtomatik zaxira yo'q**, va R2'da versiyalash ham yo'q —
o'chirilgan fayl butunlay yo'qoladi. Shuning uchun:

**Northflank'ning 2 bepul cron job'i shu ishga ketadi:**

| Cron | Jadval | Nima qiladi |
|---|---|---|
| `zaxira-baza` | har kuni 03:00 | `pg_dump \| gzip` → B2 `zaxira/YYYY-MM-DD.sql.gz` |
| `zaxira-tozalash` | har hafta | 30 kundan oshgan dump'larni o'chiradi |

Fayllar (PDF) uchun: `rclone sync r2: b2:` — oyda bir marta qo'lda yoki
xohlasangiz uchinchi cron (lekin bepul tarifda 2 ta).

**Tiklash sinovi:** dump'ni lokal Postgres'ga bir marta tiklab ko'ring.
Sinovdan o'tmagan zaxira — zaxira emas.

---

## 13. Testlar

### 13.1. Backend (`pytest-django`)

**Modellar**
- `slug` avtomatik, takrorlanmaydi, kirilldan translit qiladi
- `LoanEntry` qaytarilmagan kitobni qayta berishga yo'l qo'ymaydi
- Qaytarilgandan keyin qayta berish mumkin
- `Subject` ierarxiyasi, `toliq_nomi()`, o'ziga ota bo'lolmasligi
- `nomi()` tilga qarab, bo'sh bo'lsa `uz`'ga qaytishi
- `Form` bog'langan kitob bo'lsa o'chmasligi (`PROTECT`)

**API**
- Filtr: tur × yo'nalish × til × yil to'g'ri kesadi
- `yonalish=ichki-kasalliklar` → bolalaridagi kitoblar ham qaytadi
- `q=` kitob nomi va muallif ismi bo'yicha topadi
- Sahifalash: 24 ta, `keyingi`/`oldingi` to'g'ri
- `POST`/`PUT`/`DELETE` → 405
- Toifa nomlari uchala tilda qaytadi
- `oqish/` → presigned URL, `korishlar_soni` oshadi
- Throttle: 61-so'rov → 429
- CORS: begona `Origin` → header berilmaydi

**Saqlagich** (`SoxtaSaqlagich` bilan, internetsiz)
- `oqish_url()` muddatli URL qaytaradi
- `yuklash_url()` `Content-Type`ni qat'iy belgilaydi
- Mavjud bo'lmagan kalit → `mavjudmi()` `False`

**Admin**
- Mehmon `/admin/` ga kirmaydi
- Staff jurnal yozuvi yaratadi, ikkinchi marta xato oladi
- "Qaytarilgan deb belgilash" action ishlaydi

### 13.2. Frontend

**Vitest** — `lib/api.ts` (mock fetch), filtr URL'ga aylanishi, til tanlash
**Playwright** — uchala tilda katalog ochilishi, filtr qo'llanishi,
kitob sahifasidan o'quvchiga o'tish, PDF birinchi sahifasi render bo'lishi

---

## 14. Deploy

### 14.1. Backend env o'zgaruvchilari

| O'zgaruvchi | Misol | Izoh |
|---|---|---|
| `SECRET_KEY` | `django-insecure-...` | **almashtirilishi shart** |
| `DEBUG` | `False` | production'da hech qachon `True` emas |
| `ALLOWED_HOSTS` | `kutubxona.northflank.app` | |
| `CSRF_TRUSTED_ORIGINS` | `https://kutubxona.northflank.app` | admin uchun |
| `CORS_ALLOWED_ORIGINS` | `https://kutubxona.vercel.app` | |
| `DATABASE_URL` | `postgres://...` | Northflank addon beradi |
| `S3_ENDPOINT` | `https://<acc>.r2.cloudflarestorage.com` | |
| `S3_REGION` | `auto` | R2 uchun `auto` |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | | R2 API token |
| `S3_BUCKET_KITOBLAR` | `kutubxona-kitoblar` | yopiq |
| `S3_BUCKET_MUQOVALAR` | `kutubxona-muqovalar` | ochiq |
| `S3_OCHIQ_DOMEN` | `https://muqovalar.kutubxona.uz` | muqovalar uchun |

### 14.2. Frontend env

| O'zgaruvchi | Misol |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://kutubxona.northflank.app/api` |

### 14.3. Dockerfile (backend)

```dockerfile
FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq-dev gcc postgresql-client && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN python manage.py collectstatic --noinput
EXPOSE 8000
CMD ["gunicorn", "config.wsgi:application", \
     "--bind", "0.0.0.0:8000", "--workers", "2", "--timeout", "60"]
```

Python **3.12** — lokal 3.14 bo'lsa ham, konteynerda barqaror versiya.
`postgresql-client` — cron'dagi `pg_dump` uchun.

`--workers 2` — 512 MB RAM uchun. 4 worker qilsangiz OOM bo'ladi.

### 14.4. Salomatlik tekshiruvi

```
GET /healthz  →  200 "ok"
```

**Bazaga tegmaydi.** Sabab: har 10 soniyada bazaga so'rov yuborish
ulanish pulini behuda band qiladi va bo'lajak provayderlarda soat
hisobini yeydi.

### 14.5. Qadamlar

```
1.  Northflank: Postgres addon yaratish → DATABASE_URL olish
2.  Cloudflare: 2 bucket + API token + CORS sozlash
3.  Backblaze:  1 bucket (zaxira uchun)
4.  GitHub:     monorepo'ni push qilish
5.  Northflank: servis yaratish, root = backend/, env'larni kiritish
6.  Deploy → `python manage.py migrate` → `createsuperuser`
7.  Northflank: 2 cron job (zaxira + tozalash)
8.  Vercel:     repo'ni ulash, root = frontend/, NEXT_PUBLIC_API_URL
9.  Backend CORS_ALLOWED_ORIGINS ga Vercel domenini qo'shish
10. Sinov: katalog ochiladi, PDF o'qiladi, admin ishlaydi
```

---

## 15. Bepullikning chegaralari

| Chegara | Qachon uriladi | Yechim |
|---|---|---|
| **R2 10 GB** ⚠️ | ~500-1000 PDF | Birinchi to'siq. $0.015/GB — 50 GB uchun ~$0.60/oy |
| R2 10M o'qish/oy | Range request'lar ko'p | Bir kitob o'qish ~50-200 request. Oyiga ~50 000 o'qish sig'adi |
| R2 1M yozish/oy | Deyarli hech qachon | Faqat kitob qo'shishda |
| Northflank 2 servis | 3-servis kerak bo'lsa | Frontend Vercel'da → 1 slot bo'sh |
| Northflank 1 addon | Redis kerak bo'lsa | Kesh `locmem`; bu hajmda Redis kerak emas |
| Northflank 2 cron | 3-cron kerak bo'lsa | Ikkitasi zaxiraga ketdi; qolganini bitta skriptga qo'shish |
| Vercel 100 GB trafik | Deyarli hech qachon | PDF Vercel orqali o'tmaydi |
| Vercel Hobby notijorat | Pul ishlay boshlasangiz | Pro $20/oy |
| Postgres hajmi | ~100 000 kitob | Yaqin emas |

**Birinchi uriladigan chegara — R2'dagi 10 GB.** Kod o'zgartirmasdan hal
bo'ladi: yoki pul to'lanadi (arzon), yoki eski kitoblar B2'ga ko'chiriladi.

---

## 16. Qurish bosqichlari

| № | Bosqich | Natija | Test |
|---|---|---|---|
| 1 | Modellar + migratsiyalar | 7 model, biznes qoidalari ishlaydi | `test_models.py` yashil |
| 2 | `storage.py` + `SoxtaSaqlagich` | Presigned URL yaratiladi | `test_storage.py` |
| 3 | Django admin + jurnal | Kutubxonachi kitob qo'sha oladi | `test_admin.py` |
| 4 | DRF API + filtrlar + CORS | Ishlaydigan API | `test_api.py` |
| 5 | Backend deploy (Northflank) | Jonli `/api/` va `/admin/` | Qo'lda sinov |
| 6 | Next.js: katalog + kitob sahifasi | Ko'rinadigan katalog | Playwright |
| 7 | PDF/EPUB o'quvchi | Kitob o'qiladi | Playwright |
| 8 | 3 til + SEO (sitemap) | To'liq tizim | Playwright |
| 9 | Zaxira cron'lari | Tiklanadigan dump | Tiklash sinovi |

Har bosqich alohida commit; 5-bosqichdan keyin tizim jonli va foydalanishga
yaroqli bo'ladi — qolganlari ustiga qo'shiladi.

---

## 17. Ochiq savollar va xavflar

| № | Savol / xavf | Holat |
|---|---|---|
| 1 | **Northflank karta so'raydimi?** | ⚠️ Rasmiy sahifada aniq yozilmagan. Ro'yxatdan o'tib tekshirish kerak. So'rasa: Render (50 s uyg'onish) yoki Fly.io |
| 2 | **R2 karta so'raydi** | ✅ Ma'lum. Karta bo'lmasa Supabase (1 GB, kartasiz) bilan boshlanadi |
| 3 | Northflank bepul servis RAM/CPU | ⚠️ Hujjatda yozilmagan. `--workers 2` bilan boshlanadi, kerak bo'lsa 1 ga tushiriladi |
| 4 | Mualliflik huquqi | ⚠️ Tibbiy darsliklarni ochiq qo'yish huquqiy savol. `Book.ochiq` maydoni qo'shilsa cheklash mumkin — hozircha qo'shilmadi |
| 5 | Skanerlangan kitoblarda matn qidiruv | Hozir yo'q. Kerak bo'lsa OCR (og'ir) yoki faqat metama'lumot bo'yicha qidiruv (hozirgi holat) |
| 6 | `.uz` domen | Alohida jarayon, texnik emas |

---

## 18. Manbalar

- [Northflank pricing](https://northflank.com/pricing) — 2 servis, 1 baza, 2 cron, always-on
- [Northflank billing docs](https://northflank.com/docs/v1/application/billing/pricing-on-northflank)
- [Cloudflare R2 free tier](https://developers.cloudflare.com/r2/pricing/) — 10 GB, chiqish bepul
- [Supabase S3 compatibility](https://supabase.com/docs/guides/storage/s3/compatibility) — presigned URL (SigV4), multipart
- [Vercel Django docs](https://vercel.com/docs/frameworks/backend/django)
- [Vercel Functions limits](https://vercel.com/docs/functions/limitations)
- [Neon pricing](https://neon.com/pricing) — 100 compute-soat/oy (shu sababli rad etildi)
