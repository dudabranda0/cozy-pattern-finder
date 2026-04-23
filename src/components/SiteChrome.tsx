import { Link } from "react-router-dom";
import { LvbLogo } from "./LvbLogo";

export const SiteHeader = () => (
  <header className="sticky top-0 z-50 glass-header border-b border-border/60">
    <div className="container max-w-6xl flex items-center justify-between py-3">
      <Link to="/" aria-label="LVB Início">
        <LvbLogo size="md" />
      </Link>
      <Link
        to="/formulario"
        className="pill bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:bg-primary-hover transition-colors"
      >
        Fazer análise
      </Link>
    </div>
  </header>
);

export const SiteFooter = () => (
  <footer className="bg-[#1A1005] text-primary-foreground/80">
    <div className="container max-w-6xl py-10 flex flex-col md:flex-row items-center justify-between gap-4">
      <LvbLogo size="md" className="brightness-110" />
      <p className="text-xs md:text-sm text-primary-foreground/60 text-center md:text-right max-w-md">
        © {new Date().getFullYear()} LVB — Larissa De Vargas Brandão Advogados.
        Suas informações são tratadas com total confidencialidade.
      </p>
    </div>
  </footer>
);
