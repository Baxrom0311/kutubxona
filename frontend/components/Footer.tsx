import { Link } from "@/i18n/routing";

export default function Footer() {
  return (
    <footer className="w-full bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
        {/* Brand */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[20px]">local_library</span>
            </div>
            <span className="font-bold text-lg text-white">
              Kutubxona<span className="text-teal-400">.AI</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-sm">
            Tibbiyot va umumta'lim darsliklarining ochiq elektron kutubxonasi va DeepSeek AI maslahatchisi.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-6 text-sm">
          <Link href="/" className="hover:text-white transition-colors">
            Bosh sahifa
          </Link>
          <Link href="/katalog" className="hover:text-white transition-colors">
            Katalog
          </Link>
          <a
            href="http://127.0.0.1:8001/admin/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-teal-400 transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">lock</span>
            <span>Kutubxonachi</span>
          </a>
          <a
            href="http://127.0.0.1:8001/api/docs/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-sky-400 transition-colors"
          >
            API Docs (Swagger)
          </a>
        </div>

        {/* Copyright */}
        <div className="text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Elektron Kutubxona. Barcha huquqlar himoyalangan.</p>
          <p className="mt-1">100% Bepul va Ochiq Fond</p>
        </div>
      </div>
    </footer>
  );
}
