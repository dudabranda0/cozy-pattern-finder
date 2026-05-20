import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LvbLogo } from "./LvbLogo";
import { CAKTO_LINK } from "@/lib/lvb-constants";

export const SiteHeader = () => {
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const check = () => setPaid(localStorage.getItem("lvb_pago") === "true");
    check();
    window.addEventListener("storage", check);
    return () => window.removeEventListener("storage", check);
  }, []);

  return (
    <header className="sticky top-0 z-50 glass-header border-b border-border/60">
      <div className="container max-w-6xl flex items-center justify-between py-3 gap-3">
        <Link to="/" aria-label="LVB Início">
          <LvbLogo size="md" />
        </Link>
        <div className="flex items-center gap-2 md:gap-3">
          {paid && (
            <Link
              to="/formulario"
              className="pill border border-primary/30 bg-card hover:bg-secondary text-foreground px-3 py-2 text-xs md:text-sm font-semibold transition-colors"
            >
              <span className="hidden sm:inline">Já paguei · preencher formulário</span>
              <span className="sm:hidden">Preencher formulário</span>
            </Link>
          )}
          <a
            href={CAKTO_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-cta pill bg-primary text-primary-foreground px-4 md:px-5 py-2.5 text-xs md:text-sm font-semibold hover:bg-primary-hover"
          >
            Fazer análise
          </a>
        </div>
      </div>
    </header>
  );
};

export const SiteFooter = () => (
  <footer className="bg-[#1A1005] text-primary-foreground/80">
    <div className="container max-w-6xl py-10 flex flex-col md:flex-row items-center justify-between gap-6">
      <LvbLogo size="md" className="brightness-110" />
      <div className="flex flex-col items-center md:items-end gap-3">
        <nav className="flex gap-6 text-xs md:text-sm">
          <Link to="/termos" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
            Termos de Uso
          </Link>
          <Link to="/privacidade" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
            Política de Privacidade
          </Link>
        </nav>
        <p className="text-xs md:text-sm text-primary-foreground/60 text-center md:text-right max-w-md">
          © {new Date().getFullYear()} LVB — Larissa De Vargas Brandão.
          Suas informações são tratadas com total confidencialidade.
        </p>
      </div>
    </div>
  </footer>
);
