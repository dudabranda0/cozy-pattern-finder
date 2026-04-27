import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail, ArrowRight, MessageCircle, FileText, Scale, Target,
  AlertTriangle, Compass, ShieldCheck, Sparkles, CheckCircle2, Quote,
} from "lucide-react";
import { LvbLogo } from "@/components/LvbLogo";
import { SiteFooter } from "@/components/SiteChrome";
import { WHATSAPP_LINK } from "@/lib/lvb-constants";


/* ------------------------------------------------------------------ */
/*  PARSER                                                             */
/* ------------------------------------------------------------------ */

const SECTIONS = [
  { n: "01", title: "Resumo da Situação",     icon: FileText,      key: "RESUMO DA SITUACAO",     keywords: ["RESUMO"] },
  { n: "02", title: "Seus Direitos",          icon: Scale,         key: "SEUS DIREITOS",          keywords: ["DIREITOS"] },
  { n: "03", title: "Estratégia Recomendada", icon: Target,        key: "ESTRATEGIA RECOMENDADA", keywords: ["ESTRATEGIA", "ESTRATÉGIA", "ESTRATEG"] },
  { n: "04", title: "Pontos de Atenção",      icon: AlertTriangle, key: "PONTOS DE ATENCAO",      keywords: ["PONTOS", "ATENCAO", "ATENÇÃO"] },
  { n: "05", title: "Próximo Passo",          icon: Compass,       key: "PROXIMO PASSO",          keywords: ["PROXIMO", "PRÓXIMO", "PASSO"] },
] as const;

/** Remove acentos (NFD), normaliza espaços e converte para caixa alta. */
const strip = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .toUpperCase()
    .trim();

const normalizeHeader = (s: string) =>
  strip(
    s
      .replace(/\uFEFF/g, "")
      .replace(/["“”'‘’`´]/g, " ")
      .replace(/\*+/g, " ")
      .replace(/\s+/g, " "),
  );

const cleanSectionBody = (value: string, idx: number) => {
  let cleaned = value
    .replace(/^\s+/, "")
    .replace(/^[:\-*#\s]+/, "")
    .replace(/\*\*/g, "")
    .trim();

  const expectedKey = strip(SECTIONS[idx].key);
  const cleanedHeader = normalizeHeader(cleaned.split("\n")[0] || "");
  if (cleanedHeader.includes(expectedKey)) {
    cleaned = cleaned.split("\n").slice(1).join("\n").trim();
  }

  return cleaned;
};

type SectionMatch = { idx: number; start: number; headerEnd: number };

const getNumberedSectionMatch = (line: string) => {
  const trimmed = line.trim();
  const match = trimmed.match(
    /^(?:["“”'‘’`´]\s*)?(#{1,6}\s*|\*{1,3}\s*|BLOCO\s+)?0?([1-5])(?:\s*[.)\-:])?\s*(.*?)(?:\*{1,3})?\s*(?:["“”'‘’`´])?$/i,
  );

  if (!match) return null;

  const prefix = match[1] || "";
  const idx = Number(match[2]) - 1;
  const title = normalizeHeader(match[3] || "");
  const expected = SECTIONS[idx];
  const looksLikeTitle =
    !title ||
    title.includes(strip(expected.key)) ||
    expected.keywords.some((keyword) => title.includes(strip(keyword)));
  const hasStructuredPrefix = /#|\*|BLOCO/i.test(prefix);

  return hasStructuredPrefix || looksLikeTitle ? idx : null;
};

const getTitleSectionMatch = (line: string) => {
  const normalized = normalizeHeader(line)
    .replace(/^(?:BLOCO\s+)?0?[1-5](?:\s*[.)\-:])?\s*/, "")
    .trim();

  if (!normalized) return null;

  return SECTIONS.findIndex((section) => {
    const expectedKey = strip(section.key);
    const keywordHits = section.keywords.filter((keyword) => normalized.includes(strip(keyword))).length;
    return normalized.includes(expectedKey) || keywordHits >= Math.min(2, section.keywords.length);
  });
};

const extractByMatches = (text: string, matches: SectionMatch[]) => {
  const result = ["", "", "", "", ""];
  const ordered = [...matches]
    .sort((a, b) => a.start - b.start)
    .filter((match, index, arr) => arr.findIndex((item) => item.idx === match.idx) === index);

  for (let i = 0; i < ordered.length; i++) {
    const current = ordered[i];
    const next = ordered[i + 1];
    const body = text.slice(current.headerEnd, next ? next.start : text.length);
    result[current.idx] = cleanSectionBody(body, current.idx);
  }

  return result;
};

const collectMatches = (
  text: string,
  resolver: (line: string) => number | null,
): SectionMatch[] => {
  const lines = text.split("\n");
  const matches: SectionMatch[] = [];
  let cursor = 0;

  for (const line of lines) {
    const idx = resolver(line);
    if (idx !== null && idx >= 0) {
      matches.push({ idx, start: cursor, headerEnd: cursor + line.length });
    }
    cursor += line.length + 1;
  }

  return matches;
};

/** Quebra o texto bruto em 5 seções. Tolera `##`, `**`, `1.`, `1)`, "BLOCO 1" etc. */
const splitAnalise = (raw: string): string[] => {
  if (!raw) return ["", "", "", "", ""];
  const text = raw.replace(/\\n/g, "\n").replace(/\\r/g, "").replace(/\r/g, "").replace(/\uFEFF/g, "");

  const numbered = extractByMatches(text, collectMatches(text, getNumberedSectionMatch));
  if (numbered.some(Boolean)) return numbered;

  const titled = extractByMatches(text, collectMatches(text, getTitleSectionMatch));
  if (titled.some(Boolean)) return titled;

  // 3) Último recurso: divide por parágrafos
  const paras = text.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
  if (paras.length <= 1) return [text, "", "", "", ""];
  const chunkSize = Math.ceil(paras.length / 5);
  return Array.from({ length: 5 }, (_, i) =>
    paras.slice(i * chunkSize, (i + 1) * chunkSize).join("\n\n"),
  );
};

/* ------------------------------------------------------------------ */
/*  RICH CONTENT RENDERER                                              */
/* ------------------------------------------------------------------ */

/** Renderiza texto com suporte a **negrito**, listas com `-`/`•`/`*` e parágrafos. */
const RichContent = ({ text }: { text: string }) => {
  if (!text?.trim()) {
    return (
      <p className="text-muted-foreground italic">
        Esta seção será preenchida em instantes — aguarde a conclusão da análise.
      </p>
    );
  }

  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);

  const renderInline = (s: string): React.ReactNode[] => {
    // 1) Negrito **texto**
    const boldParts = s.split(/(\*\*[^*]+\*\*)/g);
    const nodes: React.ReactNode[] = [];
    boldParts.forEach((p, i) => {
      if (p.startsWith("**") && p.endsWith("**")) {
        nodes.push(
          <strong key={`b-${i}`} className="font-semibold text-primary">
            {p.slice(2, -2)}
          </strong>,
        );
        return;
      }
      // 2) Links: markdown [texto](url) OU URLs cruas (http/https/www)
      const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s)]+|www\.[^\s)]+)/g;
      let last = 0;
      let m: RegExpExecArray | null;
      let k = 0;
      while ((m = linkRegex.exec(p)) !== null) {
        if (m.index > last) {
          nodes.push(<span key={`t-${i}-${k}`}>{p.slice(last, m.index)}</span>);
        }
        const label = m[1] ?? m[3] ?? m[2];
        const rawUrl = m[2] ?? m[3] ?? "";
        const href = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
        nodes.push(
          <a
            key={`a-${i}-${k}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:text-primary/80 break-words font-medium"
          >
            {label}
          </a>,
        );
        last = m.index + m[0].length;
        k++;
      }
      if (last < p.length) {
        nodes.push(<span key={`t-${i}-end`}>{p.slice(last)}</span>);
      }
    });
    return nodes;
  };

  return (
    <div className="space-y-4 text-foreground/85 leading-relaxed">
      {blocks.map((block, bi) => {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        const isList = lines.every((l) => /^([-*•·]|\d+[.)])\s+/.test(l));

        if (isList) {
          return (
            <ul key={bi} className="space-y-2.5">
              {lines.map((l, li) => {
                const item = l.replace(/^([-*•·]|\d+[.)])\s+/, "");
                return (
                  <li key={li} className="flex gap-3">
                    <CheckCircle2 className="w-4 h-4 mt-1 shrink-0 text-gold" />
                    <span>{renderInline(item)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        return (
          <p key={bi} className="text-[15px] md:text-base">
            {renderInline(block)}
          </p>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  PAGE                                                               */
/* ------------------------------------------------------------------ */

const Analise = () => {
  const [raw, setRaw] = useState("");
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  
  const [tiposDivida, setTiposDivida] = useState<string[]>([]);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let r = localStorage.getItem("lvb_analise") || "";
    const e = localStorage.getItem("lvb_email") || "";
    const n = localStorage.getItem("lvb_nome") || "";
    
    const tipos = (localStorage.getItem("lvb_tipo_divida") || "")
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
    setEmail(e); setNome(n); setTiposDivida(tipos);

    if (/\{\{\s*\$?\(?['"]?[\w$]+/.test(r) && r.includes("}}")) r = "";
    if (!r && !e) { setMissing(true); return; }
    setRaw(r);

    window.scrollTo({ top: 0 });
  }, []);

  const parts = useMemo(() => splitAnalise(raw), [raw]);
  const firstName = nome.split(" ")[0] || "";
  

  // Matriz de Risco Patrimonial — uma linha por tipo de dívida marcado pelo cliente
  const riscoPatrimonial = useMemo(() => {
    const mapa: Record<string, { level: "alta" | "media" | "baixa"; desc: string }> = {
      "Financiamento imobiliário": { level: "alta", desc: "Execução extrajudicial e leilão do imóvel" },
      "Financiamento de veículo": { level: "alta", desc: "Risco de busca e apreensão do bem" },
      "Crédito consignado": { level: "alta", desc: "Desconto direto em folha — comprometimento da renda" },
      "Cartão de crédito": { level: "media", desc: "Alta probabilidade de juros abusivos" },
      "Empréstimo pessoal": { level: "media", desc: "Recálculo de margem e revisão contratual" },
      "Cheque especial": { level: "media", desc: "Juros entre os mais altos do mercado — revisão indicada" },
      "Outro tipo de dívida": { level: "media", desc: "Análise individual recomendada" },
    };
    return tiposDivida.map((tipo) => ({
      title: tipo,
      ...(mapa[tipo] || { level: "media" as const, desc: "Análise individual recomendada" }),
    }));
  }, [tiposDivida]);


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
      {/* ============ HERO ============ */}
      <header className="relative overflow-hidden bg-[#1A1005] text-primary-foreground">
        {/* gradient + decorative shapes */}
        <div className="absolute inset-0 opacity-40" style={{ background: "var(--gradient-burgundy)" }} />
        <div className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-gold/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-[380px] h-[380px] rounded-full bg-primary/40 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, hsl(var(--gold-light)) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="container max-w-4xl relative pt-12 pb-32 md:pt-16 md:pb-40">
          <div className="flex justify-center mb-7">
            <LvbLogo size="md" className="brightness-110" />
          </div>

          <div className="flex justify-center mb-5">
            <span className="pill bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 px-4 py-1.5 text-xs font-semibold inline-flex items-center">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse-dot" />
              Análise gerada com sucesso
            </span>
          </div>

          <p className="text-center text-gold-light/90 font-semibold tracking-[0.3em] text-xs uppercase mb-3">
            Análise Personalizada
          </p>
          <h1 className="font-serif-lvb text-center text-4xl md:text-6xl font-bold leading-[1.05]">
            {firstName ? (
              <>
                {firstName}, sua análise <br className="hidden md:block" />
                <span className="text-gradient-gold">está pronta</span>
              </>
            ) : (
              <>Sua análise <span className="text-gradient-gold">está pronta</span></>
            )}
          </h1>
          <p className="mt-5 text-center text-primary-foreground/70 max-w-2xl mx-auto text-base md:text-lg">
            Elaborada com base nas informações que você forneceu, seguindo a metodologia LVB de
            análise de dívidas bancárias.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3 text-xs">
            {[
              { i: ShieldCheck, t: "100% Confidencial" },
              { i: Sparkles,    t: "Estratégia Personalizada" },
              { i: Scale,       t: "Embasamento Jurídico" },
            ].map(({ i: I, t }) => (
              <span
                key={t}
                className="pill bg-primary-foreground/5 border border-primary-foreground/15 px-4 py-2 text-primary-foreground/80 inline-flex items-center gap-2"
              >
                <I className="w-3.5 h-3.5 text-gold-light" /> {t}
              </span>
            ))}
          </div>
        </div>

        {/* curved bottom */}
        <svg
          className="absolute bottom-0 left-0 right-0 w-full text-background"
          viewBox="0 0 1440 80"
          fill="currentColor"
          preserveAspectRatio="none"
        >
          <path d="M0 80V40C240 0 480 0 720 20C960 40 1200 40 1440 20V80H0Z" />
        </svg>
      </header>

      {/* ============ MAIN ============ */}
      <main className="container max-w-4xl -mt-20 relative z-10 pb-20 space-y-6">
        {/* Email confirmation card */}
        {email && (
          <div className="lvb-card border-2 border-emerald-400/40 bg-gradient-to-br from-emerald-50 to-emerald-50/30 p-5 md:p-6 flex gap-4 items-start animate-fade-up">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-700 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="text-sm md:text-base">
              <p className="font-semibold text-emerald-900">
                Sua análise está disponível agora nesta tela.
              </p>
              <p className="mt-1 text-foreground/70">
                Uma cópia também foi enviada para <strong className="text-emerald-900">{email}</strong>.
                Verifique a caixa de entrada e a pasta de spam.
              </p>
            </div>
          </div>
        )}

        {/* Quote / intro */}
        <div className="lvb-card p-6 md:p-8 bg-gradient-to-br from-card to-secondary/40 animate-fade-up" style={{ animationDelay: "60ms" }}>
          <Quote className="w-8 h-8 text-gold/60" />
          <p className="font-serif-lvb mt-3 text-xl md:text-2xl text-foreground/90 leading-snug italic">
            “Toda dívida tem uma saída — e a sua começa por entender exatamente onde você está
            hoje e quais são os próximos movimentos.”
          </p>
          <p className="mt-3 text-sm text-muted-foreground">— Equipe LVB</p>
        </div>

        {/* Sections */}
        {SECTIONS.map((s, i) => {
          const I = s.icon;
          const content = parts[i] || "";
          return (
            <article
              key={s.n}
              className="lvb-card overflow-hidden animate-fade-up group"
              style={{ animationDelay: `${120 + i * 80}ms` }}
            >
              {/* Section header */}
              <div className="relative bg-gradient-to-r from-primary via-primary to-[#4A0D17] text-primary-foreground px-6 py-5 md:px-8 md:py-6 overflow-hidden">
                <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-gold/10 blur-2xl" />
                <div className="relative flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-primary-foreground/10 border border-primary-foreground/15 flex items-center justify-center shrink-0 backdrop-blur-sm">
                      <I className="w-5 h-5 md:w-6 md:h-6 text-gold-light" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] md:text-xs font-semibold tracking-[0.25em] uppercase text-gold-light/80">
                        Bloco {s.n}
                      </p>
                      <h2 className="font-serif-lvb text-xl md:text-3xl font-bold leading-tight truncate">
                        {s.title}
                      </h2>
                    </div>
                  </div>
                  <span className="font-serif-lvb text-4xl md:text-6xl text-primary-foreground/10 font-bold leading-none select-none">
                    {s.n}
                  </span>
                </div>
              </div>

              {/* Section body */}
              <div className="p-6 md:p-8 lg:p-10 bg-card relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-gold via-gold-light to-transparent opacity-60" />
                <RichContent text={content} />
              </div>
            </article>
          );
        })}

        {/* ============ MATRIZ DE RISCO PATRIMONIAL ============ */}
        {riscoPatrimonial.length > 0 && (
          <section
            className="animate-fade-up pt-2"
            style={{ animationDelay: `${120 + SECTIONS.length * 80}ms` }}
            aria-labelledby="risco-title"
          >
            <h2
              id="risco-title"
              className="text-muted-foreground font-semibold tracking-[0.25em] text-[11px] md:text-xs uppercase mb-4 px-1"
            >
              Matriz de Risco Patrimonial
            </h2>

            <div className="lvb-card overflow-hidden bg-card divide-y divide-border">
              {riscoPatrimonial.map((item, i) => {
                const dotColor =
                  item.level === "alta"
                    ? "bg-rose-500"
                    : item.level === "media"
                    ? "bg-gold"
                    : "bg-emerald-500";
                const labelColor =
                  item.level === "alta"
                    ? "text-rose-600"
                    : item.level === "media"
                    ? "text-gold"
                    : "text-emerald-600";
                const labelText =
                  item.level === "alta" ? "ALTA" : item.level === "media" ? "MÉDIA" : "BAIXA";

                return (
                  <div key={i} className="flex items-start justify-between gap-4 p-5 md:p-6">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif-lvb font-bold text-base md:text-lg text-foreground leading-tight">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <div className="flex gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                        <span className={`w-2.5 h-2.5 rounded-full ${item.level !== "baixa" ? dotColor : "bg-border"}`} />
                        <span className={`w-2.5 h-2.5 rounded-full ${item.level === "alta" ? dotColor : "bg-border"}`} />
                      </div>
                      <span className={`text-[10px] md:text-xs font-bold tracking-wider ${labelColor}`}>
                        {labelText}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ============ CTA ============ */}

        <div
          className="relative rounded-[28px] overflow-hidden p-8 md:p-12 text-center text-primary-foreground shadow-deep animate-fade-up"
          style={{ animationDelay: "600ms" }}
        >
          <div className="absolute inset-0" style={{ background: "var(--gradient-burgundy)" }} />
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-gold/25 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-primary/40 blur-3xl" />
          <div className="relative">
            <span className="pill bg-gold/25 border border-gold/40 text-gold-light px-4 py-1.5 text-xs font-semibold inline-flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5" /> Atendimento personalizado
            </span>
            <h3 className="font-serif-lvb mt-5 text-3xl md:text-4xl font-bold leading-tight max-w-2xl mx-auto">
              Seu caso merece <span className="text-gradient-gold">atenção especializada</span>
            </h3>
            <p className="mt-4 text-primary-foreground/80 max-w-xl mx-auto text-base md:text-lg">
              Nossa equipe está pronta para conduzir seu processo com a estratégia certa para a
              sua situação específica.
            </p>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-cta mt-8 pill bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 font-bold inline-flex items-center gap-2 shadow-2xl"
            >
              <MessageCircle className="w-5 h-5" /> Falar com Nossa Equipe
            </a>
          </div>
        </div>

        {/* Nova Análise (modo teste — libera o formulário sem pagar) */}
        <div className="text-center pt-4">
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("lvb_usado");
              localStorage.removeItem("lvb_analise");
              window.location.href = "/formulario";
            }}
            className="pill border-2 border-primary/30 bg-card hover:bg-primary/5 text-primary px-6 py-3 font-semibold inline-flex items-center gap-2 transition-colors"
          >
            Fazer Nova Análise <ArrowRight className="w-4 h-4" />
          </button>
          <p className="mt-2 text-xs text-muted-foreground">
            Modo teste — libera o formulário sem pagar
          </p>
        </div>

        {/* LGPD notice */}
        <div className="bg-secondary/60 border border-border rounded-2xl p-5 text-xs md:text-sm text-muted-foreground text-center max-w-2xl mx-auto">
          <ShieldCheck className="w-4 h-4 inline mr-1.5 -mt-0.5" />
          Esta análise é informativa e não constitui orientação formal. Suas informações foram
          tratadas com total confidencialidade conforme a LGPD.
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Analise;
