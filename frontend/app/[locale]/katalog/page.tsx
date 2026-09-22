import { Link } from "@/i18n/routing";
import { kitoblarniOlish, turlarniOlish, yonalishlarniOlish } from "@/lib/api";
import KitobKartochka from "@/components/KitobKartochka";
import FiltrSidebar from "@/components/FiltrSidebar";

interface KatalogPageProps {
  searchParams: Promise<{
    turi?: string;
    yonalish?: string;
    til?: string;
    yil_dan?: string;
    yil_gacha?: string;
    q?: string;
    saralash?: string;
    sahifa?: string;
  }>;
}

export default async function KatalogPage({ searchParams }: KatalogPageProps) {
  const params = await searchParams;

  const sahifaRaqam = params.sahifa ? parseInt(params.sahifa, 10) : 1;
  const yilDan = params.yil_dan ? parseInt(params.yil_dan, 10) : undefined;
  const yilGacha = params.yil_gacha ? parseInt(params.yil_gacha, 10) : undefined;

  // Parallel fetch: books, forms, subjects
  const [kitoblarRes, turlar, yonalishlar] = await Promise.all([
    kitoblarniOlish({
      turi: params.turi,
      yonalish: params.yonalish,
      til: params.til,
      yil_dan: yilDan,
      yil_gacha: yilGacha,
      q: params.q,
      saralash: params.saralash || "-qoshilgan_sana",
      sahifa: sahifaRaqam,
    }),
    turlarniOlish(),
    yonalishlarniOlish(),
  ]);

  const jamiKitoblar = kitoblarRes.soni;
  const kitoblar = kitoblarRes.natijalar;
  const jamiSahifalar = Math.ceil(jamiKitoblar / 24) || 1;

  // Faol filtrlar teglari
  const faolFiltrlar: { kalit: string; qiymat: string; yorliq: string }[] = [];
  if (params.turi) {
    const tur = turlar.find((t) => t.slug === params.turi);
    faolFiltrlar.push({ kalit: "turi", qiymat: "", yorliq: `Turi: ${tur ? tur.nomi.uz : params.turi}` });
  }
  if (params.yonalish) {
    faolFiltrlar.push({ kalit: "yonalish", qiymat: "", yorliq: `Yo'nalish: ${params.yonalish}` });
  }
  if (params.til) {
    faolFiltrlar.push({ kalit: "til", qiymat: "", yorliq: `Til: ${params.til.toUpperCase()}` });
  }
  if (params.q) {
    faolFiltrlar.push({ kalit: "q", qiymat: "", yorliq: `Qidiruv: "${params.q}"` });
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8">
      {/* 1. Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 mb-6 font-medium">
        <Link href="/" className="hover:text-sky-800 transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">home</span>
          <span>Bosh sahifa</span>
        </Link>
        <span>/</span>
        <span className="text-sky-900 font-bold">Katalog va Qidiruv</span>
      </nav>

      {/* 2. Top Search & Sort Bar (Stitch Design) */}
      <section className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm mb-6">
        <form method="GET" className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1 flex items-center">
            <span className="material-symbols-outlined absolute left-4 text-sky-700 text-[24px]">search</span>
            <input
              name="q"
              defaultValue={params.q || ""}
              type="text"
              placeholder="Nomi, muallifi yoki mavzu bo‘yicha qidirish (masalan: 'EKG', 'Anatomiya')..."
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-slate-50 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:bg-slate-100 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Sort Select */}
            <div className="relative flex-1 md:flex-initial min-w-[200px]">
              <select
                name="saralash"
                defaultValue={params.saralash || "-qoshilgan_sana"}
                className="w-full h-12 appearance-none rounded-xl bg-slate-50 px-4 pr-10 text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="-qoshilgan_sana">Qo‘shilgan sana (Yangi)</option>
                <option value="-korishlar_soni">Ko‘rishlar soni (Ko‘p o‘qilgan)</option>
                <option value="nomi">Nomi bo‘yicha (A-Z)</option>
                <option value="-yil">Chiqarilgan yili (Oxirgi)</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[20px]">
                expand_more
              </span>
            </div>

            <button
              type="submit"
              className="h-12 px-6 rounded-xl bg-sky-800 hover:bg-sky-900 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">filter_list</span>
              <span>Qidirish</span>
            </button>
          </div>
        </form>

        {/* Active Filter Chips */}
        {faolFiltrlar.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-slate-100">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Faol filtrlar:
            </span>
            {faolFiltrlar.map((f) => (
              <span
                key={f.yorliq}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-semibold"
              >
                <span>{f.yorliq}</span>
              </span>
            ))}
            <Link
              href="/katalog"
              className="text-xs font-bold text-rose-600 hover:underline px-2 py-1 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[15px]">restart_alt</span>
              <span>Tozalash</span>
            </Link>
          </div>
        )}
      </section>

      {/* 3. Main Grid Layout (Sidebar + Books) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Filter Sidebar (3 cols) */}
        <aside className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-24">
          <FiltrSidebar turlar={turlar} yonalishlar={yonalishlar} />
        </aside>

        {/* Right Books Content (9 cols) */}
        <main className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
          {/* Header count */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Jami <strong className="text-sky-900 font-bold">{jamiKitoblar}</strong> ta darslik topildi
            </span>
            <span className="text-xs text-slate-400">
              Sahifa {sahifaRaqam} / {jamiSahifalar}
            </span>
          </div>

          {/* Book Cards Grid */}
          {kitoblar.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {kitoblar.map((kitob) => (
                <KitobKartochka key={kitob.slug} kitob={kitob} />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="w-full bg-white rounded-3xl p-12 border border-slate-100 shadow-xs flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-sky-50 text-sky-700 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[32px]">menu_book</span>
              </div>
              <h3 className="font-bold text-xl text-slate-900 mb-2 font-display">
                Hech qanday darslik topilmadi
              </h3>
              <p className="text-sm text-slate-500 max-w-md mb-6">
                Qidiruv so'zini o'zgartirib ko'ring yoki filtrlarni tozalab qayta qidiring.
              </p>
              <Link
                href="/katalog"
                className="px-6 py-3 rounded-xl bg-sky-800 text-white text-xs font-bold hover:bg-sky-900 transition-colors"
              >
                Filtrlarni tozalash
              </Link>
            </div>
          )}

          {/* Pagination */}
          {jamiSahifalar > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8 pb-12">
              {sahifaRaqam > 1 && (
                <Link
                  href={`/katalog?sahifa=${sahifaRaqam - 1}`}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                  <span>Oldingi</span>
                </Link>
              )}

              {Array.from({ length: Math.min(jamiSahifalar, 7) }, (_, i) => i + 1).map((num) => (
                <Link
                  key={num}
                  href={`/katalog?sahifa=${num}`}
                  className={`w-9 h-9 rounded-xl text-xs font-bold flex items-center justify-center transition-colors ${
                    sahifaRaqam === num
                      ? "bg-sky-800 text-white shadow-xs"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {num}
                </Link>
              ))}

              {sahifaRaqam < jamiSahifalar && (
                <Link
                  href={`/katalog?sahifa=${sahifaRaqam + 1}`}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1"
                >
                  <span>Keyingi</span>
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </Link>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
