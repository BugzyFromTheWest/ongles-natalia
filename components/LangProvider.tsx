"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { translations, type Lang } from "@/lib/i18n";

type LangCtx = {
  lang: Lang;
  toggle: () => void;
  t: (typeof translations)[Lang];
};

const LangContext = createContext<LangCtx>({
  lang: "en",
  toggle: () => {},
  t: translations.en,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem("gs_lang") as Lang | null;
    if (saved === "en" || saved === "fr") setLang(saved);
  }, []);

  function toggle() {
    const next: Lang = lang === "en" ? "fr" : "en";
    setLang(next);
    localStorage.setItem("gs_lang", next);
  }

  return (
    <LangContext.Provider value={{ lang, toggle, t: translations[lang] }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
