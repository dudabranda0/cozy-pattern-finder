import { Link } from "react-router-dom";
import { LvbLogo } from "./LvbLogo";
import { KIWIFY_LINK } from "@/lib/lvb-constants";

export const SiteHeader = () => {
  return (
    <header className="sticky top-0 z-50 glass-header border-b border-border/60">
      <div className="container max-w-6xl flex items-center justify-between py-3 gap-3">
        <Link to="/" aria-label="LVB — Larissa Brandão · Início" className="min-w-0">
          <LvbLogo size="sm" withName className="[&>span:last-child]:hidden min-[420px]:[&>span:last-child]:inline" />
        </Link>
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <a
            href={KIWIFY_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-cta bg-primary text-primary-foreground px-5 md:px-7 py-2.5 text-[11px] md:text-xs font-bold tracking-[0.12em] uppercase hover:bg-ink"
          >
            Fazer análise
          </a>
        </div>
      </div>
    </header>
  );
};

export const SiteFooter = () => (
  <footer className="bg-ink text-ink-foreground/80">
    <div className="container max-w-6xl py-10 flex flex-col md:flex-row items-center justify-between gap-6">
      <LvbLogo size="md" variant="light" withName />
      <div className="flex flex-col items-center md:items-end gap-3">
        <nav className="flex gap-6 text-xs md:text-sm">
          <Link to="/termos" className="text-ink-foreground/80 hover:text-ink-foreground transition-colors">
            Termos de Uso
          </Link>
          <Link to="/politica-de-privacidade" className="text-ink-foreground/80 hover:text-ink-foreground transition-colors">
            Política de Privacidade
          </Link>
        </nav>
        <p className="text-xs md:text-sm text-ink-foreground/60 text-center md:text-right max-w-md">
          © {new Date().getFullYear()} LVB — Larissa Brandão.
          Suas informações são tratadas com total confidencialidade.
        </p>
      </div>
    </div>
  </footer>
);
