/**
 * Kutubxona brend belgisi — ochiq kitob va uchqun.
 * PNG o'rniga inline SVG: har qanday o'lchamda aniq, tungi rejimga
 * moslashadi va qo'shimcha so'rov talab qilmaydi.
 */
export default function Logotip({
  size = 32,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id="kx-book" x1="4" y1="9" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--brand)" />
          <stop offset="1" stopColor="var(--brand-strong)" />
        </linearGradient>
      </defs>

      {/* Chap sahifa */}
      <path
        d="M15.1 12.4c0-1.85-1.35-3.42-3.18-3.72L4.4 7.46C3.63 7.33 3 7.93 3 8.7v14.6c0 .63.46 1.17 1.08 1.27l7.6 1.24c1.5.24 2.67 1.42 2.92 2.9l.02.12c.05.3.31.52.62.52h.86V12.4Z"
        fill="url(#kx-book)"
      />
      {/* O'ng sahifa */}
      <path
        d="M16.9 12.4c0-1.85 1.35-3.42 3.18-3.72l7.52-1.22c.77-.13 1.4.47 1.4 1.24v14.6c0 .63-.46 1.17-1.08 1.27l-7.6 1.24c-1.5.24-2.67 1.42-2.92 2.9l-.02.12c-.05.3-.31.52-.62.52h-.86V12.4Z"
        fill="url(#kx-book)"
        opacity="0.82"
      />
      {/* Uchqun */}
      <path
        d="M16 1.2c.2 1.72.63 2.98 1.29 3.79.66.8 1.71 1.33 3.16 1.58-1.45.25-2.5.78-3.16 1.59-.66.8-1.09 2.06-1.29 3.78-.2-1.72-.63-2.98-1.29-3.78-.66-.81-1.71-1.34-3.16-1.59 1.45-.25 2.5-.78 3.16-1.58.66-.81 1.09-2.07 1.29-3.79Z"
        fill="var(--brand)"
      />
    </svg>
  );
}
