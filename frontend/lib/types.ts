export interface MultilingualName {
  uz: string;
  ru: string;
  en: string;
}

export interface Turi {
  slug: string;
  nomi: MultilingualName;
  kitoblar_soni?: number;
}

export interface Yonalish {
  slug: string;
  nomi: MultilingualName;
  kitoblar_soni: number;
  bolalar: Yonalish[];
}

export interface KitobFayl {
  id: number;
  format: "pdf" | "epub";
  hajm: number;
  sahifalar_soni: number | null;
}

export interface Kitob {
  slug: string;
  nomi: string;
  mualliflar: string[];
  turi: {
    slug: string;
    nomi: MultilingualName;
  };
  yonalishlar: {
    slug: string;
    nomi: MultilingualName;
  }[];
  yil: number | null;
  til: "uz" | "ru" | "en";
  muqova: string;
  formatlar: ("pdf" | "epub")[];
  /** "raqamli" — saytda o'qiladi; "bosma" — faqat kutubxonadagi nusxa. */
  mavjudlik: "raqamli" | "bosma";
  /** Raqamli va fayli biriktirilgan bo'lsagina rost. */
  oqish_mumkin: boolean;
  korishlar_soni: number;
}

export interface KitobToliq extends Kitob {
  tavsif: string;
  nashriyot: string;
  qoshilgan_sana: string;
  fayllar: KitobFayl[];
}

export interface Sahifa<T> {
  soni: number;
  keyingi: string | null;
  oldingi: string | null;
  natijalar: T[];
}

export interface KatalogFiltri {
  turi?: string;
  yonalish?: string;
  til?: string;
  mavjudlik?: string;
  yil_dan?: number;
  yil_gacha?: number;
  q?: string;
  saralash?: string;
  sahifa?: number;
}

export interface OqishJavobi {
  url: string;
  format: "pdf" | "epub";
  amal_qiladi: string;
}
