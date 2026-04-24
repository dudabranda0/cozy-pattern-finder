import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail, ArrowRight, MessageCircle, FileText, Scale, Target,
  AlertTriangle, Compass, ShieldCheck, Sparkles, CheckCircle2, Quote,
} from "lucide-react";
import { LvbLogo } from "@/components/LvbLogo";
import { SiteFooter } from "@/components/SiteChrome";
import { COURSE_LINK, WHATSAPP_LINK } from "@/lib/lvb-constants";

/* ------------------------------------------------------------------ */
/*  PARSER                                                             */
/* ------------------------------------------------------------------ */

const SECTIONS = [
  { n: "01", title: "Resumo da Situação",     icon: FileText,      key: "RESUMO DA SITUACAO" },
  { n: "02", title: "Seus Direitos",          icon: Scale,         key: "SEUS DIREITOS" },
  { n: "03", title: "Estratégia Recomendada", icon: Target,        key: "ESTRATEGIA RECOMENDADA" },
  { n: "04", title: "Pontos de Atenção",      icon: AlertTriangle, key: "PONTOS DE ATENCAO" },
  { n: "05", title: "Próximo Passo",          icon: Compass,       key: "PROXIMO PASSO" },
] as const;

const strip = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

/** Quebra o texto bruto em 5 seções. Tolera `##`, `**`, `1.`, `1)`, "BLOCO 1" etc. */
const splitAnalise = (raw: string): string[] => {
  if (!raw) return ["", "", "", "", ""];
  const text = raw.replace(/\\n/g, "\n").replace(/\\r/g, "").replace(/\r/g, "");
  const result: string[] = ["", "", "", "", ""];

  // 1) Tenta achar marcadores numerados 1..5 no início de linha
  const re = /(?:^|\n)[ \t]*(?:#{1,6}[ \t]*)?(?:\*+[ \t]*)?(?:BLOCO[ \t]*)?0?([1-5])[\.\)\-:][ \t]*([^\n]*)/gi;
  const matches: { idx: number; start: number; headerEnd: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const n = parseInt(m[1], 10);
    if (n >= 1 && n <= 5) {
      matches.push({
        idx: n - 1,
        start: m.index + (m[0].startsWith("\n") ? 1 : 0),
        headerEnd: m.index + m[0].length,
      });
    }
  }

  if (matches.length >= 2) {
    for (let i = 0; i < matches.length; i++) {
      const cur = matches[i];
      const next = matches[i + 1];
      const body = text.slice(cur.headerEnd, next ? next.start : text.length);
      let cleaned = body.replace(/^[\s:\-*#]+/, "").replace(/\*\*/g, "").trim();
      const titleStripped = strip(SECTIONS[cur.idx].key);
      if (strip(cleaned).startsWith(titleStripped)) {
        cleaned = cleaned.slice(SECTIONS[cur.idx].key.length).replace(/^[\s:\-*#\n]+/, "").trim();
      }
      if (!result[cur.idx]) result[cur.idx] = cleaned;
    }
    if (result.some(Boolean)) return result;
  }

  // 2) Fallback: split pelos títulos em caixa alta
  const stripped = strip(text);
  for (let i = 0; i < SECTIONS.length; i++) {
    const titleStripped = strip(SECTIONS[i].key);
    const pos = stripped.indexOf(titleStripped);
    if (pos >= 0) {
      const nextPos =
        i + 1 < SECTIONS.length
          ? stripped.indexOf(strip(SECTIONS[i + 1].key), pos + titleStripped.length)
          : -1;
      const end = nextPos > 0 ? nextPos : text.length;
      result[i] = text.slice(pos + titleStripped.length, end)
        .replace(/^[\s:\-*#\n]+/, "")
        .replace(/\*\*/g, "")
        .trim();
    }
  }
  if (result.some(Boolean)) return result;

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

  const renderInline = (s: string) => {
    const parts = s.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) =>
      p.startsWith("**") && p.endsWith("**") ? (
        <strong key={i} className="font-semibold text-primary">{p.slice(2, -2)}</strong>
      ) : (
        <span key={i}>{p}</span>
      ),
    );
  };

  return (
    <div className="space-y-4 text-foreground/85 leading-relaxed">
      {blocks.map((block, bi) => {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        const isList = lines.every((l) => /^([-*•·]|\d+[\.\)])\s+/.test(l));

        if (isList) {
          return (
            <ul key={bi} className="space-y-2.5">
              {lines.map((l, li) => {
                const item = l.replace(/^([-*•·]|\d+[\.\)])\s+/, "");
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

  const parts = useMemo(() => splitAnalise(raw), [raw]);
  const firstName = nome.split(" ")[0] || "";
  const isLowDebt = /Até R\$ 5\.000|R\$ 5\.000 a R\$ 15\.000|R\$ 15\.000 a R\$ 30\.000/.test(total);

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
          <p className="mt-3 text-sm text-muted-foreground">— Equipe LVB Advogados</p>
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

        {/* ============ CTA ============ */}
        {isLowDebt ? (
          <div
            className="relative rounded-[28px] overflow-hidden p-8 md:p-12 text-center text-white shadow-deep animate-fade-up"
            style={{ animationDelay: "600ms" }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#0D4A20] via-[#0F5A28] to-[#072F14]" />
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-emerald-300/10 blur-3xl" />
            <div className="relative">
              <span className="pill bg-emerald-300/20 border border-emerald-300/40 text-emerald-100 px-4 py-1.5 text-xs font-semibold inline-flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" /> Indicado para o seu perfil
              </span>
              <h3 className="font-serif-lvb mt-5 text-3xl md:text-4xl font-bold leading-tight max-w-2xl mx-auto">
                Aprenda a negociar sua dívida e consiga até{" "}
                <span className="text-emerald-200">90% de desconto</span>
              </h3>
              <p className="mt-4 text-white/80 max-w-xl mx-auto text-base md:text-lg">
                Curso completo com o método LVB para você renegociar com força, sabendo
                exatamente quais são seus direitos.
              </p>
              <a
                href={COURSE_LINK}
                className="mt-8 pill bg-white text-[#0D4A20] hover:bg-white/95 px-8 py-4 font-bold inline-flex items-center gap-2 transition-all hover:scale-[1.02] shadow-2xl"
              >
                Acessar o Curso Agora <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        ) : (
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
                className="mt-8 pill bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 font-bold inline-flex items-center gap-2 transition-all hover:scale-[1.02] shadow-2xl"
              >
                <MessageCircle className="w-5 h-5" /> Falar com Nossa Equipe
              </a>
            </div>
          </div>
        )}

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
