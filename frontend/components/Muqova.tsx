import Image from "next/image";

/* Muqova rasmi bo'lmagan kitoblar uchun — tasodifiy kulrang to'rtburchak
   o'rniga chinakam muqovaga o'xshash ko'rinish. Rang kitob slug'idan
   hisoblanadi, ya'ni har safar bir xil bo'ladi va ro'yxatda xilma-xillik
   paydo bo'ladi. */
const ranglar = [
  { fon: "#1b3a8f", chetI: "#122a6b" },
  { fon: "#134e4a", chetI: "#0c3734" },
  { fon: "#332e73", chetI: "#241f57" },
  { fon: "#164e63", chetI: "#0e3746" },
  { fon: "#5b2333", chetI: "#401824" },
  { fon: "#1f4fe0", chetI: "#173cb0" },
];

function rangTanlash(slug: string) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return ranglar[h % ranglar.length];
}

interface MuqovaProps {
  slug: string;
  nomi: string;
  muqova?: string;
  muallif?: string;
  /** Rasm uchun `sizes` — Next.js optimallashtirishi uchun. */
  sizes?: string;
  priority?: boolean;
  /** Katta ko'rinishlar uchun matn o'lchamini oshiradi. */
  katta?: boolean;
}

export default function Muqova({
  slug,
  nomi,
  muqova,
  muallif,
  sizes = "200px",
  priority,
  katta,
}: MuqovaProps) {
  if (muqova) {
    return (
      <Image src={muqova} alt="" fill priority={priority} sizes={sizes} className="object-cover" />
    );
  }

  const { fon, chetI } = rangTanlash(slug);

  return (
    <div
      className="absolute inset-0 flex flex-col justify-between"
      style={{
        background: `linear-gradient(150deg, ${fon} 0%, ${chetI} 100%)`,
        // Muqovaning chap cheti — jild kitob taassurotini beradi.
        borderLeft: `6px solid ${chetI}`,
      }}
    >
      <div className={katta ? "px-5 pt-6" : "px-3.5 pt-4"}>
        <p
          className={`font-display text-white leading-snug line-clamp-5 ${
            katta ? "text-[19px]" : "text-[13px]"
          }`}
        >
          {nomi}
        </p>
        <div className={`h-px bg-white/30 ${katta ? "w-12 mt-4" : "w-8 mt-2.5"}`} />
      </div>

      {muallif && (
        <p
          className={`text-white/55 line-clamp-2 ${
            katta ? "px-5 pb-6 text-[13px]" : "px-3.5 pb-4 text-[11px]"
          }`}
        >
          {muallif}
        </p>
      )}
    </div>
  );
}
