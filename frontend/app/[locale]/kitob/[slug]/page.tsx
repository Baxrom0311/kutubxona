import Image from "next/image";
import { Link } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { kitobniOlish, kitoblarniOlish } from "@/lib/api";

interface KitobDetailPageProps {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
}

export const revalidate = 3600; // ISR: 1 soat

export default async function KitobDetailPage({ params }: KitobDetailPageProps) {
  const { slug } = await params;
  const kitob = await kitobniOlish(slug);

  if (!kitob) {
    notFound();
  }

  // O'xshash kitoblarni olish (bir xil yo'nalishdagi)
  const yonalishSlug =
    kitob.yonalishlar && kitob.yonalishlar.length > 0
      ? kitob.yonalishlar[0].slug
      : undefined;

  const oxshashRes = await kitoblarniOlish({
    yonalish: yonalishSlug,
    turi: kitob.turi.slug,
  });

  const oxshashKitoblar = oxshashRes.natijalar
    .filter((k) => k.slug !== kitob.slug)
    .slice(0, 3);

  const birinchiPdf = kitob.fayllar?.find((f) => f.format === "pdf");
  const birinchiEpub = kitob.fayllar?.find((f) => f.format === "epub");

  const mualliflarMatni =
    kitob.mualliflar && kitob.mualliflar.length > 0
      ? kitob.mualliflar.join(", ")
      : "Muallif ko'rsatilmagan";

  const yonalishlarMatni =
    kitob.yonalishlar && kitob.yonalishlar.length > 0
      ? kitob.yonalishlar.map((y) => y.nomi.uz).join(" → ")
      : kitob.turi.nomi.uz;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8">
      {/* 1. Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 mb-8 font-medium">
        <Link href="/" className="hover:text-sky-800 transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">home</span>
          <span>Bosh sahifa</span>
        </Link>
        <span>/</span>
        <Link href="/katalog" className="hover:text-sky-800 transition-colors">
          Katalog
        </Link>
        <span>/</span>
        <span className="text-sky-900 font-bold truncate max-w-md">{kitob.nomi}</span>
      </nav>

      {/* 2. Main Showcase (From Stitch Design) */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-sm mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: 3D Cover & Action buttons (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center">
            {/* 3D Book Cover */}
            <div className="relative w-full max-w-[320px] aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-sky-50 shadow-2xl mb-6 group border border-slate-100">
              {kitob.muqova ? (
                <Image
                  src={kitob.muqova}
                  alt={kitob.nomi}
                  fill
                  priority
                  className="object-cover group-hover:scale-102 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
                  <span className="material-symbols-outlined text-6xl text-sky-400 mb-3">
                    menu_book
                  </span>
                  <span className="font-bold text-sm text-slate-600 line-clamp-4 font-display">
                    {kitob.nomi}
                  </span>
                </div>
              )}

              {/* Status pill overlay */}
              <div className="absolute bottom-3 left-3 right-3 flex justify-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/80 backdrop-blur-md text-emerald-200 text-xs font-semibold shadow-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Onlayn mutolaa uchun tayyor</span>
                </span>
              </div>
            </div>

            {/* Read Buttons */}
            <div className="w-full max-w-[320px] flex flex-col gap-2.5">
              {birinchiPdf ? (
                <Link
                  href={`/kitob/${kitob.slug}/oqish/${birinchiPdf.id}`}
                  className="w-full py-3.5 rounded-xl bg-sky-800 hover:bg-sky-900 text-white font-bold text-sm text-center shadow-md flex items-center justify-center gap-2 transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">auto_stories</span>
                  <span>
                    Mutolaa qilish (PDF
                    {birinchiPdf.sahifalar_soni ? ` - ${birinchiPdf.sahifalar_soni} bet` : ""})
                  </span>
                </Link>
              ) : (
                <div className="w-full py-3.5 rounded-xl bg-slate-100 text-slate-500 font-medium text-xs text-center">
                  Raqamli fayl biriktirilmagan
                </div>
              )}

              {birinchiEpub && (
                <Link
                  href={`/kitob/${kitob.slug}/oqish/${birinchiEpub.id}`}
                  className="w-full py-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold text-xs text-center border border-teal-200 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">phone_iphone</span>
                  <span>EPUB formatida o‘qish</span>
                </Link>
              )}
            </div>
          </div>

          {/* Right Column: Metadata & Synopsis (7 cols) */}
          <div className="lg:col-span-7 flex flex-col">
            {/* Category tag */}
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold uppercase tracking-wider">
                {kitob.turi.nomi.uz}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-teal-700">
                {yonalishlarMatni}
              </span>
            </div>

            {/* Title */}
            <h1 className="font-extrabold text-2xl sm:text-4xl text-slate-900 leading-tight mb-4 font-display">
              {kitob.nomi}
            </h1>

            {/* Author */}
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
              <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-sm">
                <span className="material-symbols-outlined text-[20px]">person</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Muallif:</span>
                <span className="font-bold text-slate-800 text-sm">{mualliflarMatni}</span>
              </div>
            </div>

            {/* 4-Box Metadata Grid (Stitch Design) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-400 block font-semibold uppercase tracking-wider mb-1">
                  Nashriyot
                </span>
                <span className="font-bold text-xs text-slate-800 truncate block">
                  {kitob.nashriyot || "Noma'lum"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-400 block font-semibold uppercase tracking-wider mb-1">
                  Chiqarilgan yili
                </span>
                <span className="font-bold text-xs text-slate-800">
                  {kitob.yil || "Noma'lum"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-400 block font-semibold uppercase tracking-wider mb-1">
                  Tili
                </span>
                <span className="font-bold text-xs text-slate-800 uppercase">
                  {kitob.til}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-400 block font-semibold uppercase tracking-wider mb-1">
                  Ko‘rishlar
                </span>
                <span className="font-bold text-xs text-teal-700">
                  {kitob.korishlar_soni} marta
                </span>
              </div>
            </div>

            {/* Synopsis / Annotation */}
            <div className="mb-6">
              <h2 className="font-bold text-lg text-slate-900 mb-3 font-display">
                Kitob haqida
              </h2>
              <div className="text-sm text-slate-600 leading-relaxed space-y-3 whitespace-pre-line">
                {kitob.tavsif ||
                  "Ushbu darslik tibbiyot va hamshiralik ishi bo‘yicha talabalar hamda mutaxassislar uchun mo‘ljallangan ilmiy-amaliy qo‘llanma hisoblanadi. Klinik diagnostika, bemor parvarishi va zamonaviy tibbiy protokollarni o‘z ichiga oladi."}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Related Books */}
      {oxshashKitoblar.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-xl text-slate-900 font-display">
              Mavzuga oid boshqa darsliklar
            </h3>
            <Link
              href={`/katalog?yonalish=${yonalishSlug}`}
              className="text-xs font-bold text-sky-800 hover:text-teal-700 flex items-center gap-1"
            >
              <span>Yo'nalishdagi barchasi</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {oxshashKitoblar.map((k) => (
              <div
                key={k.slug}
                className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase text-sky-700 block mb-1">
                    {k.turi.nomi.uz}
                  </span>
                  <Link href={`/kitob/${k.slug}`}>
                    <h4 className="font-bold text-sm text-slate-800 hover:text-sky-800 line-clamp-2 mb-1">
                      {k.nomi}
                    </h4>
                  </Link>
                  <p className="text-xs text-slate-500 line-clamp-1 mb-3">
                    {k.mualliflar?.join(", ") || "Muallif ko'rsatilmagan"}
                  </p>
                </div>
                <Link
                  href={`/kitob/${k.slug}`}
                  className="text-xs font-bold text-teal-700 flex items-center gap-1"
                >
                  <span>Ko‘rish</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
