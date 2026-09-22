import { Link } from "@/i18n/routing";
import { kitoblarniOlish, yonalishlarniOlish } from "@/lib/api";
import KitobKartochka from "@/components/KitobKartochka";

export const revalidate = 3600; // ISR: 1 soat

export default async function HomePage() {
  // Yangi va eng ko'p o'qilgan kitoblarni olish
  const [yangiKitoblarRes, ommabopKitoblarRes, yonalishlar] = await Promise.all([
    kitoblarniOlish({ saralash: "-qoshilgan_sana" }),
    kitoblarniOlish({ saralash: "-korishlar_soni" }),
    yonalishlarniOlish(),
  ]);

  const yangiKitoblar = yangiKitoblarRes.natijalar.slice(0, 4);
  const ommabopKitoblar = ommabopKitoblarRes.natijalar.slice(0, 4);

  const ommabopMavzular = [
    { nom: "Hamshiralik ishi asoslari", q: "hamshiralik" },
    { nom: "EKG tahlili", q: "EKG" },
    { nom: "Shoshilinch tibbiy yordam", q: "shoshilinch" },
    { nom: "Pediatriya parvarishi", q: "pediatriya" },
    { nom: "Aseptika va antiseptika", q: "aseptika" },
    { nom: "Farmakoterapiya", q: "farmakoterapiya" },
  ];

  const mutaxassisliklar = [
    {
      nom: "Terapiya va parvarish",
      tavsif: "Ichki kasalliklar, geriatriya va umumiy profilaktika",
      icon: "medical_services",
      soni: "140+ darslik",
      yonalish: "ichki-kasalliklar",
    },
    {
      nom: "Xirurgiya va operatsiya",
      tavsif: "Operatsiyadan keyingi parvarish, aseptika, bog'lovlar",
      icon: "healing",
      soni: "95+ darslik",
      yonalish: "xirurgiya",
    },
    {
      nom: "Anesteziologiya va reanimatsiya",
      tavsif: "Intensiv terapiya, hayotiy ko'rsatkichlar monitoringi",
      icon: "vital_signs",
      soni: "70+ darslik",
      yonalish: "reanimatsiya",
    },
    {
      nom: "Pediatriya va neonatal parvarish",
      tavsif: "Chaqaloqlar va bolalar parvarishi klinik standartlari",
      icon: "child_care",
      soni: "85+ darslik",
      yonalish: "pediatriya",
    },
    {
      nom: "Shoshilinch tibbiy yordam",
      tavsif: "Kardiogen shok, travmalar va tezkor algoritmlar",
      icon: "emergency",
      soni: "60+ darslik",
      yonalish: "shoshilinch",
    },
    {
      nom: "Klinik Kardiologiya",
      tavsif: "Yurak qon-tomir kasalliklari va diagnostikasi",
      icon: "cardiology",
      soni: "55+ darslik",
      yonalish: "kardiologiya",
    },
  ];

  return (
    <div className="w-full flex flex-col items-center">
      {/* 1. Hero Section (Stitch Design) */}
      <section className="relative w-full overflow-hidden py-16 lg:py-24">
        {/* Ambient Glows */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-sky-200/40 rounded-full blur-[110px] pointer-events-none" />
        <div className="absolute top-1/3 -right-24 w-[420px] h-[420px] bg-teal-200/40 rounded-full blur-[90px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-12 flex flex-col items-center text-center">
          {/* Verified Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white shadow-xs mb-6 border border-slate-100">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-teal-600 text-white">
              <span className="material-symbols-outlined text-[12px]">check</span>
            </span>
            <span className="text-xs font-bold text-sky-900 tracking-wide uppercase">
              Hamshiralar va Talabalar Uchun Rasmiy Elektron Kutubxona
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="font-extrabold text-3xl sm:text-5xl lg:text-6xl max-w-4xl text-slate-900 tracking-tight leading-tight mb-4 font-display">
            Hamshiralik ishi va klinik amaliyot bo‘yicha zamonaviy bilimlar xazinasi
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mb-8 leading-relaxed">
            Bemor parvarishi, muolaja standartlari, shoshilinch yordam va klinik darsliklarni bepul qidiring va o‘qing. Ro‘yxatdan o‘tish talab etilmaydi.
          </p>

          {/* Search Bar */}
          <div className="w-full max-w-3xl bg-white p-2.5 rounded-2xl shadow-xl border border-slate-100 mb-6">
            <form action="/katalog" method="GET" className="flex flex-col sm:flex-row items-center gap-2">
              <div className="flex items-center gap-3 w-full px-4 py-2 text-slate-400">
                <span className="material-symbols-outlined text-sky-700 text-[26px]">search</span>
                <input
                  name="q"
                  type="text"
                  placeholder="Darslik nomi, muallif, muolaja standarti yoki kasallik bo‘yicha qidiring..."
                  className="w-full bg-transparent text-sm sm:text-base text-slate-800 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-sky-800 hover:bg-sky-900 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-md flex-shrink-0"
              >
                <span>Qidirish</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </form>
          </div>

          {/* Quick Tags */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mb-8">
            <span className="text-xs font-medium text-slate-500">Ommabop mavzular:</span>
            {ommabopMavzular.map((m) => (
              <Link
                key={m.q}
                href={`/katalog?q=${encodeURIComponent(m.q)}`}
                className="px-3 py-1 rounded-full bg-white hover:bg-sky-50 text-slate-600 hover:text-sky-800 text-xs font-medium border border-slate-200/60 shadow-2xs transition-colors"
              >
                {m.nom}
              </Link>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/katalog"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-sky-800 hover:bg-sky-900 text-white text-sm font-semibold shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">menu_book</span>
              <span>Katalogga o‘tish</span>
            </Link>
            <Link
              href="/katalog"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-sky-900 text-sm font-semibold border border-slate-200 shadow-sm flex items-center justify-center gap-2 transition-all"
            >
              <span className="material-symbols-outlined text-teal-600 text-[20px]">auto_awesome</span>
              <span>Barcha Darsliklar</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Metrics Strip */}
      <section className="w-full max-w-7xl mx-auto px-6 lg:px-12 mb-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[26px]">collections_bookmark</span>
            </div>
            <div>
              <span className="block font-bold text-2xl text-slate-900 font-display">850+</span>
              <span className="text-xs text-slate-500">Klinik darsliklar</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[26px]">medical_services</span>
            </div>
            <div>
              <span className="block font-bold text-2xl text-slate-900 font-display">24+</span>
              <span className="text-xs text-slate-500">Ixtisoslik yo‘nalishlari</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[26px]">lock_open_right</span>
            </div>
            <div>
              <span className="block font-bold text-2xl text-slate-900 font-display">100%</span>
              <span className="text-xs text-slate-500">Ochiq va bepul</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[26px]">bolt</span>
            </div>
            <div>
              <span className="block font-bold text-xl text-slate-900 font-display">Tezkor</span>
              <span className="text-xs text-slate-500">Bir zumda o'qish</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Specialties Grid (From Stitch) */}
      <section className="w-full max-w-7xl mx-auto px-6 lg:px-12 mb-20">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider block mb-1">
              Mutaxassisliklar
            </span>
            <h2 className="font-extrabold text-2xl sm:text-3xl text-slate-900 font-display">
              Hamshiralik va klinik yo‘nalishlar
            </h2>
          </div>
          <Link
            href="/katalog"
            className="text-xs font-bold text-sky-800 hover:text-teal-700 flex items-center gap-1 transition-colors"
          >
            <span>Barcha yo'nalishlarni ko'rish</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {mutaxassisliklar.map((spec) => (
            <Link
              key={spec.nom}
              href={`/katalog?yonalish=${spec.yonalish}`}
              className="group p-6 rounded-2xl bg-white border border-slate-100 hover:border-teal-300 hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-sky-50 group-hover:bg-teal-600 text-sky-800 group-hover:text-white flex items-center justify-center transition-colors mb-4">
                  <span className="material-symbols-outlined text-[24px]">
                    {spec.icon}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-slate-900 group-hover:text-teal-800 transition-colors mb-2">
                  {spec.nom}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {spec.tavsif}
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-400">
                <span className="text-teal-700 font-semibold">{spec.soni}</span>
                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. New Arrivals (Yangi qo'shilganlar) */}
      {yangiKitoblar.length > 0 && (
        <section className="w-full max-w-7xl mx-auto px-6 lg:px-12 mb-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs font-bold text-sky-700 uppercase tracking-wider block mb-1">
                Yangi adabiyotlar
              </span>
              <h2 className="font-extrabold text-2xl sm:text-3xl text-slate-900 font-display">
                Yangi qo‘shilgan klinik darsliklar
              </h2>
            </div>
            <Link
              href="/katalog?saralash=-qoshilgan_sana"
              className="text-xs font-bold text-sky-800 hover:text-teal-700 flex items-center gap-1 transition-colors"
            >
              <span>Katalogda ko'rish</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {yangiKitoblar.map((kitob) => (
              <KitobKartochka key={kitob.slug} kitob={kitob} />
            ))}
          </div>
        </section>
      )}

      {/* 5. DeepSeek AI Banner Callout (From Stitch) */}
      <section className="w-full max-w-7xl mx-auto px-6 lg:px-12 mb-24">
        <div className="relative rounded-3xl p-8 lg:p-12 bg-gradient-to-r from-sky-900 via-teal-900 to-slate-900 text-white overflow-hidden shadow-2xl">
          <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-teal-300 mb-4 border border-white/10">
              <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
              <span>DeepSeek AI LLM Maslahatchisi</span>
            </div>
            <h2 className="font-extrabold text-2xl sm:text-4xl leading-tight font-display mb-4">
              Kerakli darslik yoki klinik protokolni topa olmadingizmi?
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-8">
              Sun'iy intellekt yordamchisiga kasallik alomati, muolaja nomi yoki dars mavzusini ayting — u kutubxona fondidagi eng mos darsliklarni tavsiya qiladi.
            </p>
            <Link
              href="/katalog"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-sm font-bold shadow-lg transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">smart_toy</span>
              <span>Katalog orqali qidirish</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
