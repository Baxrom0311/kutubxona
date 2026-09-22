import { Link } from "@/i18n/routing";
import { kitoblarniOlish, yonalishlarniOlish } from "@/lib/api";
import KitobKartochka from "@/components/KitobKartochka";
import { getTranslations } from "next-intl/server";

export const revalidate = 3600; // ISR: 1 soat

interface HomePageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  // Yangi va eng ko'p o'qilgan kitoblarni olish
  const [yangiKitoblarRes, yonalishlar] = await Promise.all([
    kitoblarniOlish({ saralash: "-qoshilgan_sana" }),
    yonalishlarniOlish(),
  ]);

  const yangiKitoblar = yangiKitoblarRes.natijalar.slice(0, 4);

  const ommabopMavzular = [
    { nom: locale === "ru" ? "Основы сестринского дела" : locale === "en" ? "Nursing Fundamentals" : "Hamshiralik ishi asoslari", q: "hamshiralik" },
    { nom: locale === "ru" ? "Анализ ЭКГ" : locale === "en" ? "ECG Diagnostics" : "EKG tahlili", q: "EKG" },
    { nom: locale === "ru" ? "Скорая помощь" : locale === "en" ? "Emergency Care" : "Shoshilinch tibbiy yordam", q: "shoshilinch" },
    { nom: locale === "ru" ? "Педиатрический уход" : locale === "en" ? "Pediatric Care" : "Pediatriya parvarishi", q: "pediatriya" },
    { nom: locale === "ru" ? "Асептика и антисептика" : locale === "en" ? "Asepsis & Antisepsis" : "Aseptika va antiseptika", q: "aseptika" },
    { nom: locale === "ru" ? "Фармакотерапия" : locale === "en" ? "Pharmacotherapy" : "Farmakoterapiya", q: "farmakoterapiya" },
  ];

  const darslikText = locale === "ru" ? "учебников" : locale === "en" ? "textbooks" : "darslik";

  const mutaxassisliklar = [
    {
      nom: locale === "ru" ? "Терапия и уход" : locale === "en" ? "Therapy & Nursing Care" : "Terapiya va parvarish",
      tavsif: locale === "ru" ? "Внутренние болезни, гериатрия и общая профилактика" : locale === "en" ? "Internal medicine, geriatrics and clinical care" : "Ichki kasalliklar, geriatriya va umumiy profilaktika",
      icon: "medical_services",
      soni: `140+ ${darslikText}`,
      yonalish: "ichki-kasalliklar",
    },
    {
      nom: locale === "ru" ? "Хирургия и операционный блок" : locale === "en" ? "Surgery & Operating Block" : "Xirurgiya va operatsiya",
      tavsif: locale === "ru" ? "Послеоперационный уход, асептика, перевязки" : locale === "en" ? "Post-op care, asepsis, wound dressing" : "Operatsiyadan keyingi parvarish, aseptika, bog'lovlar",
      icon: "healing",
      soni: `95+ ${darslikText}`,
      yonalish: "xirurgiya",
    },
    {
      nom: locale === "ru" ? "Анестезиология и реанимация" : locale === "en" ? "Anesthesiology & ICU" : "Anesteziologiya va reanimatsiya",
      tavsif: locale === "ru" ? "Интенсивная терапия, мониторинг жизненных функций" : locale === "en" ? "Intensive care, vital signs clinical monitoring" : "Intensiv terapiya, hayotiy ko'rsatkichlar monitoringi",
      icon: "vital_signs",
      soni: `70+ ${darslikText}`,
      yonalish: "reanimatsiya",
    },
    {
      nom: locale === "ru" ? "Педиатрия и неонатальный уход" : locale === "en" ? "Pediatrics & Neonatal Care" : "Pediatriya va neonatal parvarish",
      tavsif: locale === "ru" ? "Клинические стандарты ухода за новорожденными и детьми" : locale === "en" ? "Clinical standards for newborn and infant care" : "Chaqaloqlar va bolalar parvarishi klinik standartlari",
      icon: "child_care",
      soni: `85+ ${darslikText}`,
      yonalish: "pediatriya",
    },
    {
      nom: locale === "ru" ? "Неотложная медицинская помощь" : locale === "en" ? "Emergency Medical Aid" : "Shoshilinch tibbiy yordam",
      tavsif: locale === "ru" ? "Кардиогенный шок, травмы и алгоритмы скорой помощи" : locale === "en" ? "Cardiogenic shock, trauma and first responder protocols" : "Kardiogen shok, travmalar va tezkor algoritmlar",
      icon: "emergency",
      soni: `60+ ${darslikText}`,
      yonalish: "shoshilinch",
    },
    {
      nom: locale === "ru" ? "Клиническая кардиология" : locale === "en" ? "Clinical Cardiology" : "Klinik Kardiologiya",
      tavsif: locale === "ru" ? "Сердечно-сосудистые заболевания и диагностика" : locale === "en" ? "Cardiovascular diseases and clinical diagnostics" : "Yurak qon-tomir kasalliklari va diagnostikasi",
      icon: "cardiology",
      soni: `55+ ${darslikText}`,
      yonalish: "kardiologiya",
    },
  ];

  return (
    <div className="w-full flex flex-col items-center">
      {/* 1. Hero Section (Stitch Design) */}
      <section className="relative w-full overflow-hidden py-16 lg:py-24">
        {/* Ambient Glows */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-sky-200/40 dark:bg-sky-950/30 rounded-full blur-[110px] pointer-events-none" />
        <div className="absolute top-1/3 -right-24 w-[420px] h-[420px] bg-teal-200/40 dark:bg-teal-950/30 rounded-full blur-[90px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-12 flex flex-col items-center text-center animate-fade-in">
          {/* Verified Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-slate-900 shadow-2xs mb-6 border border-slate-200 dark:border-slate-800 hover:scale-102 transition-transform">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-teal-600 text-white">
              <span className="material-symbols-outlined text-[12px]">check</span>
            </span>
            <span className="text-xs font-bold text-sky-900 dark:text-sky-300 tracking-wide uppercase">
              {t("badge")}
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="font-extrabold text-3xl sm:text-5xl lg:text-6xl max-w-4xl text-slate-900 dark:text-white tracking-tight leading-tight mb-4 font-display">
            {t("sarlavha")}
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mb-8 leading-relaxed">
            {t("tavsif")}
          </p>

          {/* Search Bar */}
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 p-2.5 rounded-2xl shadow-md hover:shadow-lg focus-within:shadow-xl focus-within:ring-2 focus-within:ring-sky-500/20 border border-slate-200 dark:border-slate-800 mb-6 transition-all duration-300">
            <form action={`/${locale}/katalog`} method="GET" className="flex flex-col sm:flex-row items-center gap-2">
              <div className="flex items-center gap-3 w-full px-4 py-2 text-slate-400">
                <span className="material-symbols-outlined text-sky-700 dark:text-sky-400 text-[26px]">search</span>
                <input
                  name="q"
                  type="text"
                  placeholder={t("qidiruvPlaceholder")}
                  className="w-full bg-transparent text-sm sm:text-base text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-sky-800 hover:bg-sky-900 dark:bg-sky-600 dark:hover:bg-sky-500 text-white text-sm font-semibold hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 shadow-md flex-shrink-0"
              >
                <span>{t("qidirish")}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </form>
          </div>

          {/* Quick Tags */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mb-8">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t("ommabopMavzular")}:</span>
            {ommabopMavzular.map((m) => (
              <Link
                key={m.q}
                href={`/katalog?q=${encodeURIComponent(m.q)}`}
                className="px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 hover:bg-sky-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-sky-800 dark:hover:text-white text-xs font-medium border border-slate-200 dark:border-slate-800 shadow-2xs hover:-translate-y-0.5 transition-all duration-200"
              >
                {m.nom}
              </Link>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/katalog"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-sky-800 hover:bg-sky-900 dark:bg-sky-600 dark:hover:bg-sky-500 text-white text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 transition-all duration-200"
            >
              <span className="material-symbols-outlined text-[20px]">menu_book</span>
              <span>{t("kataloggaOtish")}</span>
            </Link>
            <Link
              href="/katalog"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-sky-900 dark:text-white text-sm font-semibold border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 transition-all duration-200"
            >
              <span className="material-symbols-outlined text-teal-600 dark:text-teal-400 text-[20px]">auto_awesome</span>
              <span>{t("barchaDarsliklar")}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Metrics Strip */}
      <section className="w-full max-w-7xl mx-auto px-6 lg:px-12 mb-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[26px]">collections_bookmark</span>
            </div>
            <div>
              <span className="block font-bold text-2xl text-slate-900 dark:text-white font-display">850+</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{t("statDarsliklar")}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[26px]">medical_services</span>
            </div>
            <div>
              <span className="block font-bold text-2xl text-slate-900 dark:text-white font-display">24+</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{t("statYonalishlar")}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[26px]">lock_open_right</span>
            </div>
            <div>
              <span className="block font-bold text-2xl text-slate-900 dark:text-white font-display">100%</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{t("statOchiq")}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[26px]">bolt</span>
            </div>
            <div>
              <span className="block font-bold text-xl text-slate-900 dark:text-white font-display">Tezkor</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{t("statTezkor")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Specialties Grid (From Stitch) */}
      <section className="w-full max-w-7xl mx-auto px-6 lg:px-12 mb-20">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider block mb-1">
              {t("mutaxassisliklarSubtitle")}
            </span>
            <h2 className="font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white font-display">
              {t("mutaxassisliklarSarlavha")}
            </h2>
          </div>
          <Link
            href="/katalog"
            className="text-xs font-bold text-sky-800 dark:text-sky-400 hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-1 transition-colors"
          >
            <span>{t("barchaYonalishlar")}</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {mutaxassisliklar.map((spec) => (
            <Link
              key={spec.nom}
              href={`/katalog?yonalish=${spec.yonalish}`}
              className="group p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-slate-800 group-hover:bg-teal-600 text-sky-800 dark:text-sky-400 group-hover:text-white flex items-center justify-center transition-colors mb-4 shadow-2xs">
                  <span className="material-symbols-outlined text-[24px]">
                    {spec.icon}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-teal-800 dark:group-hover:text-teal-300 transition-colors mb-2">
                  {spec.nom}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {spec.tavsif}
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-medium text-slate-400">
                <span className="text-teal-700 dark:text-teal-400 font-semibold">{spec.soni}</span>
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
              <span className="text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider block mb-1">
                {t("yangiAdabiyotlarSub")}
              </span>
              <h2 className="font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white font-display">
                {t("yangiAdabiyotlar")}
              </h2>
            </div>
            <Link
              href="/katalog?saralash=-qoshilgan_sana"
              className="text-xs font-bold text-sky-800 dark:text-sky-400 hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-1 transition-colors"
            >
              <span>{t("katalogdaKorish")}</span>
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

      {/* 5. AI Maslahatchi Banner Callout */}
      <section className="w-full max-w-7xl mx-auto px-6 lg:px-12 mb-24">
        <div className="relative rounded-3xl p-8 lg:p-12 bg-gradient-to-br from-sky-900 via-teal-900 to-slate-900 text-white overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300 border border-sky-800/40 dark:border-slate-800">
          <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-teal-300 mb-4 border border-white/10">
              <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
              <span>{t("aiBannerBadge")}</span>
            </div>
            <h2 className="font-extrabold text-2xl sm:text-4xl leading-tight font-display mb-4">
              {t("aiBannerSarlavha")}
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-8">
              {t("aiBannerTavsif")}
            </p>
            <Link
              href="/katalog"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 active:scale-95 text-slate-950 text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              <span className="material-symbols-outlined text-[20px]">smart_toy</span>
              <span>{t("aiBannerBtn")}</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
