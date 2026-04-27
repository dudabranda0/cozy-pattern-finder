import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail, ArrowRight, MessageCircle, Scale, ShieldCheck, AlertTriangle,
  Sparkles, CheckCircle2, Phone, Info, Gavel,
} from "lucide-react";
import { LvbLogo } from "@/components/LvbLogo";
import { SiteFooter } from "@/components/SiteChrome";
import { COURSE_LINK, WHATSAPP_LINK, CAKTO_LINK } from "@/lib/lvb-constants";

/* ------------------------------------------------------------------ */
/*  TIPOS DO JSON ESTRUTURADO (vindo do n8n)                           */
/* ------------------------------------------------------------------ */

type LegalTipo = "info" | "defensoria" | "alerta" | "lei";

type LegalCard = {
  tipo: LegalTipo;
  titulo: string;
  texto: string;
  link_label?: string;
  link_url?: string;
};

type RiscoNivel = "alta" | "media" | "baixa";

type RiscoItem = {
  divida: string;
  descricao: string;
  nivel: RiscoNivel;
};

type AnaliseEstruturada = {
  resumo?: string;
  analise_legal?: LegalCard[];
  matriz_risco?: RiscoItem[];
  estrategia?: string[];
  cta?: { titulo?: string; texto?: string; botao?: string };
};

/* ------------------------------------------------------------------ */
/*  PARSER — JSON estruturado OU fallback de texto livre               */
/* ------------------------------------------------------------------ */

const tryParseEstruturada = (raw: string): AnaliseEstruturada | null => {
  if (!raw?.trim()) return null;
  try {
    const j = JSON.parse(raw);
    const obj = Array.isArray(j) ? j[0] : j;
    if (!obj || typeof obj !== "object") return null;
    if (
      obj.analise_legal || obj.matriz_risco || obj.estrategia ||
      obj.resumo || obj.cta
    ) {
      return obj as AnaliseEstruturada;
    }
    return null;
  } catch {
    return null;
  }
};

/** Fallback: divide texto livre em parágrafos para exibição simples. */
const splitFallback = (raw: string): string[] => {
  if (!raw) return [];
  return raw
    .replace(/\\n/g, "\n")
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
};

/* ------------------------------------------------------------------ */
/*  RICH TEXT (negrito + listas)                                        */
/* ------------------------------------------------------------------ */

const renderInline = (s: string) => {
  const parts = s.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="font-semibold text-foreground">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
};

const RichText = ({ text, className = "" }: { text: string; className?: string }) => {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className={`space-y-3 ${className}`}>
      {blocks.map((block, bi) => {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        const isList = lines.every((l) => /^([-*•·]|\d+[.)])\s+/.test(l));
        if (isList) {
          return (
            <ul key={bi} className="space-y-2">
              {lines.map((l, li) => {
                const item = l.replace(/^([-*•·]|\d+[.)])\s+/, "");
                return (
                  <li key={li} className="flex gap-2.5">
                    <CheckCircle2 className="w-4 h-4 mt-1 shrink-0 text-primary/70" />
                    <span>{renderInline(item)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }
        return <p key={bi}>{renderInline(block)}</p>;
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  CARD LEGAL (4 estilos: info / defensoria / alerta / lei)           */
/* ------------------------------------------------------------------ */

const LEGAL_STYLES: Record<
  LegalTipo,
  {
    Icon: typeof Info;
    iconWrap: string;
    iconColor: string;
    border: string;
    bg: string;
    title: string;
    body: string;
    link: string;
  }
> = {
  info: {
    Icon: Scale,
    iconWrap: "bg-secondary/80",
    iconColor: "text-foreground/80",
    border: "border-border",
    bg: "bg-card",
    title: "text-foreground",
    body: "text-foreground/75",
    link: "text-foreground hover:text-primary",
  },
  defensoria: {
    Icon: ShieldCheck,
    iconWrap: "bg-secondary/80",
    iconColor: "text-foreground/80",
    border: "border-[#D8CFE8]",
    bg: "bg-[#F7F4FB]",
    title: "text-foreground",
    body: "text-foreground/75",
    link: "text-foreground hover:text-primary",
  },
  alerta: {
    Icon: AlertTriangle,
    iconWrap: "bg-amber-100",
    iconColor: "text-amber-700",
    border: "border-amber-300/70",
    bg: "bg-amber-50/70",
    title: "text-amber-900",
    body: "text-amber-900/85",
    link: "text-amber-900 hover:text-amber-700",
  },
  lei: {
    Icon: Gavel,
    iconWrap: "bg-secondary/80",
    iconColor: "text-foreground/80",
    border: "border-[#D8CFE8]",
    bg: "bg-[#F7F4FB]",
    title: "text-foreground",
    body: "text-foreground/75",
    link: "text-foreground hover:text-primary",
  },
};

const LegalCardView = ({ card }: { card: LegalCard }) => {
  const s = LEGAL_STYLES[card.tipo] || LEGAL_STYLES.info;
  const I = s.Icon;
  return (
    <article className={`rounded-2xl border ${s.border} ${s.bg} p-5 md:p-6`}>
      <div className="flex gap-4">
        <div className={`w-11 h-11 rounded-xl ${s.iconWrap} flex items-center justify-center shrink-0`}>
          <I className={`w-5 h-5 ${s.iconColor}`} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className={`font-serif-lvb text-lg md:text-xl font-bold ${s.title}`}>
            {card.titulo}
          </h3>
          <p className={`mt-2 text-[15px] leading-relaxed ${s.body}`}>
            {card.texto}
          </p>
          {card.link_url && card.link_label && (
            <a
              href={card.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-3 inline-block text-sm font-semibold underline underline-offset-4 ${s.link} transition-colors`}
            >
              {card.link_label}
            </a>
          )}
        </div>
      </div>
    </article>
  );
};

/* ------------------------------------------------------------------ */
/*  MATRIZ DE RISCO                                                    */
/* ------------------------------------------------------------------ */

const RISCO_STYLES: Record<RiscoNivel, { dots: string; label: string; text: string }> = {
  alta: { dots: "bg-rose-400",   label: "ALTA",  text: "text-rose-500" },
  media: { dots: "bg-amber-400", label: "MÉDIA", text: "text-amber-500" },
  baixa: { dots: "bg-emerald-400", label: "BAIXA", text: "text-emerald-500" },
};

const Dots = ({ nivel }: { nivel: RiscoNivel }) => {
  const filled = nivel === "alta" ? 3 : nivel === "media" ? 2 : 1;
  const s = RISCO_STYLES[nivel];
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`w-2 h-2 rounded-full ${i < filled ? s.dots : "bg-muted"}`}
        />
      ))}
    </div>
  );
};

const MatrizRisco = ({ items }: { items: RiscoItem[] }) => (
  <section>
    <p className="text-xs font-semibold tracking-[0.25em] uppercase text-muted-foreground mb-3">
      Matriz de Risco Patrimonial
    </p>
    <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
      {items.map((it, i) => {
        const s = RISCO_STYLES[it.nivel] || RISCO_STYLES.media;
        return (
          <div key={i} className="p-5 md:p-6 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h4 className="font-bold text-foreground">{it.divida}</h4>
              <p className="text-sm text-muted-foreground mt-0.5">{it.descricao}</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <Dots nivel={it.nivel} />
              <span className={`text-[11px] font-bold tracking-widest ${s.text}`}>
                {s.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/*  ESTRATÉGIA NUMERADA                                                */
/* ------------------------------------------------------------------ */

const Estrategia = ({ items }: { items: string[] }) => (
  <section>
    <p className="text-xs font-semibold tracking-[0.25em] uppercase text-muted-foreground mb-3">
      Estratégia de Defesa Recomendada
    </p>
    <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-7">
      {items.map((txt, i) => (
        <div key={i}>
          <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-foreground/80 mb-3">
            {String(i + 1).padStart(2, "0")}
          </div>
          <p className="text-[15px] leading-relaxed text-foreground/80">{txt}</p>
        </div>
      ))}
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/*  PAGE                                                               */
/* ------------------------------------------------------------------ */

const Analise = () => {
  const [raw, setRaw] = useState("");
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [total, setTotal] = useState("");
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let r = localStorage.getItem("lvb_analise") || "";
    const e = localStorage.getItem("lvb_email") || "";
    const n = localStorage.getItem("lvb_nome") || "";
    const t = localStorage.getItem("lvb_total_dividas") || "";
    setEmail(e); setNome(n); setTotal(t);

    if (/\{\{\s*\$?\(?['"]?[\w$]+/.test(r) && r.includes("}}")) r = "";
    if (!r && !e) { setMissing(true); return; }
    setRaw(r);

    window.scrollTo({ top: 0 });
  }, []);

  const estruturada = useMemo(() => tryParseEstruturada(raw), [raw]);
  const fallbackParas = useMemo(
    () => (estruturada ? [] : splitFallback(raw)),
    [raw, estruturada],
  );

  const firstName = nome.split(" ")[0] || "";
  const isLowDebt = /Até R\$ 5\.000|R\$ 5\.000 a R\$ 15\.000|R\$ 15\.000 a R\$ 30\.000/.test(total);

  const ctaTitulo = estruturada?.cta?.titulo || "Sua situação é séria — mas tem saída.";
  const ctaTexto =
    estruturada?.cta?.texto ||
    "Com o volume de dívidas que você declarou, cada dia sem ação aumenta o risco de penhora e bloqueio judicial. A Dra. Larissa Brandão já ajudou clientes a proteger mais de R$ 200M em patrimônio. O próximo passo é falar diretamente com a equipe.";
  const ctaBotao = estruturada?.cta?.botao || "FALAR COM A EQUIPE AGORA";

  if (missing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="lvb-card max-w-md p-8 text-center">
          <LvbLogo size="md" className="mx-auto" />
          <h1 className="font-serif-lvb mt-6 text-2xl font-bold">Análise não encontrada</h1>
          <p className="mt-3 text-muted-foreground">
            Sua análise não foi encontrada. Verifique seu e-mail ou refaça o formulário.
          </p>
          <Link
            to="/formulario"
            className="mt-6 pill bg-primary hover:bg-primary-hover text-primary-foreground px-6 py-3 font-semibold inline-flex items-center gap-2 transition-colors"
          >
            Refazer formulário <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ============ HEADER LIMPO ============ */}
      <header className="bg-background border-b border-border">
        <div className="container max-w-3xl py-5 flex items-center justify-between">
          <LvbLogo size="md" />
          <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
            Análise Privada
          </span>
        </div>
      </header>

      {/* ============ INTRO ============ */}
      <section className="container max-w-3xl pt-10 md:pt-14 pb-6">
        <span className="inline-flex items-center gap-2 pill bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 px-3 py-1 text-[11px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
          Análise gerada com sucesso
        </span>
        <h1 className="font-serif-lvb mt-5 text-3xl md:text-5xl font-bold leading-[1.1] text-foreground">
          {firstName ? `${firstName}, sua análise está pronta.` : "Sua análise está pronta."}
        </h1>
        <p className="mt-4 text-muted-foreground text-base md:text-lg max-w-2xl">
          Elaborada com base nas informações que você forneceu, seguindo a metodologia LVB de
          análise de dívidas bancárias.
        </p>

        {email && (
          <div className="mt-6 flex items-start gap-3 text-sm text-muted-foreground">
            <Mail className="w-4 h-4 mt-0.5 shrink-0 text-foreground/50" />
            <p>
              Uma cópia foi enviada para{" "}
              <strong className="text-foreground/80">{email}</strong>. Verifique a caixa de entrada
              e a pasta de spam.
            </p>
          </div>
        )}
      </section>

      {/* ============ CONTEÚDO ============ */}
      <main className="container max-w-3xl pb-20 space-y-10">
        {/* RESUMO */}
        {estruturada?.resumo && (
          <section className="rounded-2xl bg-card border border-border p-6 md:p-8">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-muted-foreground mb-3">
              Resumo da Situação
            </p>
            <p className="text-[15px] md:text-base leading-relaxed text-foreground/85">
              {estruturada.resumo}
            </p>
          </section>
        )}

        {/* ANÁLISE CONTRATUAL / LEGAL */}
        {estruturada?.analise_legal && estruturada.analise_legal.length > 0 && (
          <section>
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-muted-foreground mb-4">
              Análise Contratual / Legal
            </p>
            <div className="space-y-4">
              {estruturada.analise_legal.map((card, i) => (
                <LegalCardView key={i} card={card} />
              ))}
            </div>
          </section>
        )}

        {/* MATRIZ DE RISCO */}
        {estruturada?.matriz_risco && estruturada.matriz_risco.length > 0 && (
          <MatrizRisco items={estruturada.matriz_risco} />
        )}

        {/* ESTRATÉGIA */}
        {estruturada?.estrategia && estruturada.estrategia.length > 0 && (
          <Estrategia items={estruturada.estrategia} />
        )}

        {/* FALLBACK: texto livre quando o n8n ainda não retorna JSON */}
        {!estruturada && fallbackParas.length > 0 && (
          <section className="rounded-2xl bg-card border border-border p-6 md:p-8">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-muted-foreground mb-4">
              Sua Análise
            </p>
            <RichText
              text={fallbackParas.join("\n\n")}
              className="text-foreground/85 leading-relaxed text-[15px] md:text-base"
            />
          </section>
        )}

        {/* ============ CTA ESCURO ============ */}
        <section className="relative rounded-3xl overflow-hidden bg-[#0B1437] text-white p-8 md:p-12 text-center">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-16 w-64 h-64 rounded-full bg-indigo-500/20 blur-3xl" />

          <div className="relative">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center relative">
              <ShieldCheck className="w-6 h-6 text-white" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-blue-400" />
            </div>

            <h3 className="font-serif-lvb mt-6 text-2xl md:text-4xl font-bold leading-tight max-w-xl mx-auto">
              {ctaTitulo}
            </h3>
            <p className="mt-4 text-white/70 max-w-xl mx-auto text-[15px] md:text-base leading-relaxed">
              {ctaTexto}
            </p>

            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-cta mt-8 inline-flex items-center justify-center gap-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 font-bold uppercase tracking-wide text-sm md:text-base shadow-2xl transition-colors w-full sm:w-auto"
            >
              <Phone className="w-4 h-4" /> {ctaBotao}
            </a>

            <p className="mt-5 text-[11px] tracking-[0.2em] uppercase text-white/50">
              Resposta em até 24h · Atendimento privado
            </p>
          </div>
        </section>

        {/* CTA CURSO (apenas se dívida baixa) */}
        {isLowDebt && (
          <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-700 to-emerald-900 text-white p-8 md:p-10 text-center">
            <span className="pill bg-white/15 border border-white/25 text-white px-3 py-1 text-[11px] font-semibold inline-flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" /> Indicado para o seu perfil
            </span>
            <h3 className="font-serif-lvb mt-4 text-2xl md:text-3xl font-bold leading-tight max-w-xl mx-auto">
              Aprenda a negociar e consiga até{" "}
              <span className="text-emerald-200">90% de desconto</span>
            </h3>
            <a
              href={COURSE_LINK}
              className="btn-cta mt-6 inline-flex items-center gap-2 rounded-full bg-white text-emerald-800 px-7 py-3.5 font-bold shadow-xl"
            >
              Acessar o Curso <ArrowRight className="w-4 h-4" />
            </a>
          </section>
        )}

        {/* Nova Análise */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("lvb_usado");
              localStorage.removeItem("lvb_analise");
              window.location.href = CAKTO_LINK;
            }}
            className="pill border border-border bg-card hover:bg-secondary text-foreground/80 px-6 py-3 font-semibold inline-flex items-center gap-2 transition-colors"
          >
            Fazer Nova Análise <ArrowRight className="w-4 h-4" />
          </button>
          <p className="mt-2 text-xs text-muted-foreground">Nova análise por R$ 29,90</p>
        </div>

        {/* LGPD */}
        <div className="text-xs text-muted-foreground text-center max-w-2xl mx-auto pt-4 border-t border-border">
          <ShieldCheck className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
          <span className="mt-3 inline-block">
            Esta análise é informativa e não constitui orientação formal. Suas informações foram
            tratadas com total confidencialidade conforme a LGPD.
          </span>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Analise;
