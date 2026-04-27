import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail, ArrowRight, MessageCircle, FileText, Compass,
  ShieldCheck, Sparkles, CheckCircle2, Quote, Scale,
  AlertTriangle, ShieldAlert, Gavel, FileSearch, ScrollText,
} from "lucide-react";
import { LvbLogo } from "@/components/LvbLogo";
import { SiteFooter } from "@/components/SiteChrome";
import { COURSE_LINK, WHATSAPP_LINK, CAKTO_LINK } from "@/lib/lvb-constants";


/* ------------------------------------------------------------------ */
/*  TIPOS DA RESPOSTA ESTRUTURADA                                      */
/* ------------------------------------------------------------------ */

type RiscoNivel = "alta" | "media" | "baixa";

type AnaliseContratualItem = {
  titulo: string;
  descricao: string;
  cor?: "purple" | "amber" | "neutral"; // cor lateral do card
  link_label?: string;                   // ex: "Verificar unidade mais próxima →"
  link_url?: string;
};

type MatrizRiscoItem = {
  titulo: string;
  descricao: string;
  nivel: RiscoNivel;
};

type EstrategiaPasso = {
  numero: string; // "01"..."04"
  texto: string;
};

type AnaliseEstruturada = {
  resumo?: string;            // bloco 01
  seus_direitos?: AnaliseContratualItem[];      // bloco 02
  estrategia_recomendada?: AnaliseContratualItem[]; // bloco 03
  pontos_atencao?: AnaliseContratualItem[];     // bloco 04
  analise_contratual?: AnaliseContratualItem[];
  matriz_risco?: MatrizRiscoItem[];
  estrategia_defesa?: EstrategiaPasso[];
  proximo_passo?: string;     // bloco final
};

/* ------------------------------------------------------------------ */
/*  PARSER: aceita JSON estruturado OU texto legado                    */
/* ------------------------------------------------------------------ */

const strip = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").toUpperCase().trim();

const LEGACY_SECTIONS = [
  { key: "RESUMO",   field: "resumo" as const },
  { key: "PROXIMO",  field: "proximo_passo" as const },
  { key: "PRÓXIMO",  field: "proximo_passo" as const },
  { key: "PASSO",    field: "proximo_passo" as const },
];

/** Tenta extrair Resumo e Próximo Passo de um texto livre (formato antigo). */
const parseLegacyText = (raw: string): AnaliseEstruturada => {
  if (!raw) return {};
  const text = raw.replace(/\\n/g, "\n").replace(/\r/g, "");
  const lines = text.split("\n");
  const out: AnaliseEstruturada = {};

  type Match = { idx: number; field: "resumo" | "proximo_passo" };
  const matches: { pos: number; line: number; field: "resumo" | "proximo_passo" }[] = [];

  let cursor = 0;
  lines.forEach((line, i) => {
    const norm = strip(line.replace(/[#*"`]/g, " "));
    if (/(^|\s)0?1[\.\)]?/.test(norm) || norm.includes("RESUMO")) {
      if (norm.includes("RESUMO") || /^0?1[\.\)\s]/.test(norm.trim())) {
        matches.push({ pos: cursor, line: i, field: "resumo" });
      }
    }
    if (norm.includes("PROXIMO") || norm.includes("PRÓXIMO") || norm.includes("PASSO")) {
      matches.push({ pos: cursor, line: i, field: "proximo_passo" });
    }
    cursor += line.length + 1;
  });

  // dedupe por field, mantendo primeira ocorrência
  const seen = new Set<string>();
  const ordered = matches.filter(m => (seen.has(m.field) ? false : (seen.add(m.field), true)))
                         .sort((a, b) => a.pos - b.pos);

  ordered.forEach((m, i) => {
    const next = ordered[i + 1];
    const startLine = m.line + 1;
    const endLine = next ? next.line : lines.length;
    const body = lines.slice(startLine, endLine).join("\n")
      .replace(/^[\s:\-*#]+/, "")
      .replace(/\*\*/g, "")
      .trim();
    out[m.field] = body;
  });

  if (!out.resumo && !out.proximo_passo) {
    out.resumo = text.trim();
  }

  return out;
};

const parseAnalise = (raw: string): AnaliseEstruturada => {
  if (!raw) return {};
  // tentar JSON primeiro
  try {
    const j = JSON.parse(raw);
    if (j && typeof j === "object" && (j.resumo || j.seus_direitos || j.estrategia_recomendada || j.pontos_atencao || j.analise_contratual || j.matriz_risco || j.estrategia_defesa || j.proximo_passo)) {
      return j as AnaliseEstruturada;
    }
  } catch { /* não é JSON */ }
  return parseLegacyText(raw);
};

/* ------------------------------------------------------------------ */
/*  RENDERER DE TEXTO RICO (negrito + listas)                          */
/* ------------------------------------------------------------------ */

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
/*  COMPONENTES VISUAIS DAS NOVAS SEÇÕES                               */
/* ------------------------------------------------------------------ */

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] md:text-xs font-semibold tracking-[0.28em] uppercase text-muted-foreground/80 mb-4 mt-2">
    {children}
  </p>
);

const COR_MAP = {
  purple: {
    border: "border-l-[5px] border-l-[#9B72CF]",
    iconBg: "bg-[#EDE5FA] text-[#5B3A99]",
    title: "text-[#2A1B45]",
    body: "text-[#3F2D5C]/85",
  },
  amber: {
    border: "border-l-[5px] border-l-[#E8B84A]",
    iconBg: "bg-[#FBEED4] text-[#9B6B16]",
    title: "text-[#7A3E0B]",
    body: "text-[#7A3E0B]/85",
  },
  neutral: {
    border: "border-l-[5px] border-l-transparent",
    iconBg: "bg-secondary text-foreground/70",
    title: "text-foreground",
    body: "text-foreground/75",
  },
} as const;

const ICONS_CONTRATUAL = [Scale, ShieldCheck, AlertTriangle, Gavel, FileSearch, ScrollText];

const ContratualCard = ({ item, idx }: { item: AnaliseContratualItem; idx: number }) => {
  const Icon = ICONS_CONTRATUAL[idx % ICONS_CONTRATUAL.length];
  const cor = COR_MAP[item.cor || "neutral"];
  return (
    <div className={`bg-card rounded-2xl ${cor.border} border border-border shadow-sm p-5 md:p-6 flex gap-4`}>
      <div className={`w-11 h-11 rounded-full ${cor.iconBg} flex items-center justify-center shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <h3 className={`font-serif-lvb font-bold text-lg md:text-xl ${cor.title} leading-snug`}>
          {item.titulo}
        </h3>
        <p className={`mt-1.5 text-[14px] md:text-[15px] leading-relaxed ${cor.body}`}>
          {item.descricao}
        </p>
        {item.link_label && item.link_url && (
          <a
            href={item.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-semibold text-foreground underline underline-offset-4 decoration-2 decoration-foreground/40 hover:decoration-primary"
          >
            {item.link_label}
          </a>
        )}
      </div>
    </div>
  );
};

const NIVEL_STYLE = {
  alta:  { dot: "bg-[#FF5A6E]", label: "ALTA",  text: "text-[#E5354A]" },
  media: { dot: "bg-[#F2B441]", label: "MÉDIA", text: "text-[#C8861A]" },
  baixa: { dot: "bg-[#3FB984]", label: "BAIXA", text: "text-[#1F8556]" },
} as const;

const RiscoRow = ({ item, isLast }: { item: MatrizRiscoItem; isLast: boolean }) => {
  const s = NIVEL_STYLE[item.nivel] || NIVEL_STYLE.media;
  const dotsCount = item.nivel === "alta" ? 3 : item.nivel === "media" ? 2 : 1;
  return (
    <div className={`flex items-center justify-between gap-4 py-4 md:py-5 ${isLast ? "" : "border-b border-border"}`}>
      <div className="min-w-0 flex-1">
        <h3 className="font-serif-lvb font-bold text-lg md:text-xl text-foreground leading-tight">
          {item.titulo}
        </h3>
        <p className="mt-1 text-[13px] md:text-sm text-muted-foreground">
          {item.descricao}
        </p>
      </div>
      <div className="flex flex-col items-end shrink-0">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`w-2.5 h-2.5 rounded-full ${i < dotsCount ? s.dot : "bg-muted"}`}
            />
          ))}
        </div>
        <span className={`mt-1.5 text-[10px] md:text-xs font-bold tracking-[0.18em] ${s.text}`}>
          {s.label}
        </span>
      </div>
    </div>
  );
};

const EstrategiaCard = ({ passos }: { passos: EstrategiaPasso[] }) => (
  <div className="bg-card rounded-2xl border border-border shadow-sm p-6 md:p-8">
    <ol className="space-y-7">
      {passos.map((p, i) => (
        <li key={i} className="flex flex-col gap-3">
          <span className="w-12 h-12 rounded-full bg-[#E6EAE5] text-[#1F3D2A] flex items-center justify-center text-sm font-bold tracking-wider">
            {p.numero}
          </span>
          <p className="text-[15px] md:text-base leading-relaxed text-foreground/85">
            {p.texto}
          </p>
        </li>
      ))}
    </ol>
  </div>
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

  const data = useMemo(() => parseAnalise(raw), [raw]);
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

  // Fallback visual: se o n8n ainda não retorna os novos campos, mostra exemplos
  // para que os 5 blocos visuais sempre apareçam.
  const FALLBACK_DIREITOS: AnaliseContratualItem[] = [
    { titulo: "Revisão Contratual", descricao: "Direito a expurgar juros abusivos, anatocismo e tarifas ilegais previsto no art. 51 do CDC.", cor: "purple" },
    { titulo: "Mínimo Existencial", descricao: "Lei 14.181/2021 garante a preservação de renda mínima para subsistência da família.", cor: "neutral" },
    { titulo: "Repactuação Compulsória", descricao: "Art. 104-A do CDC permite renegociação global das dívidas em juízo.", cor: "amber" },
    { titulo: "Defensoria Pública", descricao: "Acesso gratuito à assistência jurídica integral conforme renda familiar.", cor: "neutral", link_label: "Verificar unidade mais próxima →", link_url: "https://www.google.com/search?q=defensoria+publica+mais+proxima" },
    { titulo: "Direito à Informação", descricao: "Bancos são obrigados a fornecer extrato detalhado e contratos firmados (art. 6º, III do CDC).", cor: "purple" },
  ];
  const FALLBACK_ESTRATEGIA: AnaliseContratualItem[] = [
    { titulo: "Auditoria Contratual", descricao: "Levantamento dos contratos para identificar cobranças indevidas e capitalização de juros.", cor: "neutral" },
    { titulo: "Notificação Extrajudicial", descricao: "Comunicação formal aos bancos exigindo revisão antes de medidas judiciais.", cor: "purple" },
    { titulo: "Ação de Repactuação", descricao: "Protocolo da ação coletiva sob a Lei do Superendividamento.", cor: "neutral" },
    { titulo: "Bloqueio de Cobranças Abusivas", descricao: "Tutela de urgência para suspender descontos que comprometem o mínimo existencial.", cor: "amber" },
    { titulo: "Acompanhamento Especializado", descricao: "Assessoria contínua da equipe LVB durante todo o processo de renegociação.", cor: "neutral" },
  ];
  const FALLBACK_ATENCAO: AnaliseContratualItem[] = [
    { titulo: "Acordos Administrativos", descricao: "Aceitar acordo direto com o banco pode gerar confissão de dívida com juros sobre juros.", cor: "amber" },
    { titulo: "Risco de Penhora", descricao: "Em caso de execução judicial, há risco real de bloqueio de contas e bens.", cor: "amber" },
    { titulo: "Prazo Prescricional", descricao: "Cada dia parado reduz o tempo hábil para defesa e revisão de contratos antigos.", cor: "neutral" },
    { titulo: "Negativação Indevida", descricao: "Manutenção do nome em cadastros após pagamento gera direito a indenização.", cor: "purple" },
    { titulo: "Documentação Essencial", descricao: "Guarde todos os contratos, boletos e comprovantes — são prova fundamental.", cor: "amber" },
  ];

  const direitos = data.seus_direitos?.length ? data.seus_direitos : FALLBACK_DIREITOS;
  const estrategiaRec = data.estrategia_recomendada?.length ? data.estrategia_recomendada : FALLBACK_ESTRATEGIA;
  const atencao = data.pontos_atencao?.length ? data.pontos_atencao : FALLBACK_ATENCAO;

  const hasDireitos = direitos.length > 0;
  const hasEstrategiaRec = estrategiaRec.length > 0;
  const hasAtencao = atencao.length > 0;
  const hasContratual = (data.analise_contratual?.length ?? 0) > 0;
  const hasMatriz = (data.matriz_risco?.length ?? 0) > 0;
  const hasEstrategia = (data.estrategia_defesa?.length ?? 0) > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* ============ HERO ============ */}
      <header className="relative overflow-hidden bg-[#1A1005] text-primary-foreground">
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

        <div className="lvb-card p-6 md:p-8 bg-gradient-to-br from-card to-secondary/40 animate-fade-up" style={{ animationDelay: "60ms" }}>
          <Quote className="w-8 h-8 text-gold/60" />
          <p className="font-serif-lvb mt-3 text-xl md:text-2xl text-foreground/90 leading-snug italic">
            “Toda dívida tem uma saída — e a sua começa por entender exatamente onde você está
            hoje e quais são os próximos movimentos.”
          </p>
          <p className="mt-3 text-sm text-muted-foreground">— Equipe LVB</p>
        </div>

        {/* ============ BLOCO 01 — RESUMO ============ */}
        <article className="lvb-card overflow-hidden animate-fade-up" style={{ animationDelay: "120ms" }}>
          <div className="relative bg-gradient-to-r from-primary via-primary to-[#4A0D17] text-primary-foreground px-6 py-5 md:px-8 md:py-6 overflow-hidden">
            <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-gold/10 blur-2xl" />
            <div className="relative flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-primary-foreground/10 border border-primary-foreground/15 flex items-center justify-center shrink-0 backdrop-blur-sm">
                  <FileText className="w-5 h-5 md:w-6 md:h-6 text-gold-light" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] md:text-xs font-semibold tracking-[0.25em] uppercase text-gold-light/80">
                    Bloco 01
                  </p>
                  <h2 className="font-serif-lvb text-xl md:text-3xl font-bold leading-tight truncate">
                    Resumo da Situação
                  </h2>
                </div>
              </div>
              <span className="font-serif-lvb text-4xl md:text-6xl text-primary-foreground/10 font-bold leading-none select-none">
                01
              </span>
            </div>
          </div>
          <div className="p-6 md:p-8 lg:p-10 bg-card relative">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-gold via-gold-light to-transparent opacity-60" />
            <RichContent text={data.resumo || ""} />
          </div>
        </article>

        {/* ============ BLOCO 02 — SEUS DIREITOS ============ */}
        {hasDireitos && (
          <section className="animate-fade-up" style={{ animationDelay: "160ms" }}>
            <SectionLabel>02 · Seus Direitos</SectionLabel>
            <div className="space-y-3">
              {direitos.map((item, i) => (
                <ContratualCard key={i} item={item} idx={i} />
              ))}
            </div>
          </section>
        )}

        {/* ============ BLOCO 03 — ESTRATÉGIA RECOMENDADA ============ */}
        {hasEstrategiaRec && (
          <section className="animate-fade-up" style={{ animationDelay: "200ms" }}>
            <SectionLabel>03 · Estratégia Recomendada</SectionLabel>
            <div className="space-y-3">
              {estrategiaRec.map((item, i) => (
                <ContratualCard key={i} item={item} idx={i} />
              ))}
            </div>
          </section>
        )}

        {/* ============ BLOCO 04 — PONTOS DE ATENÇÃO ============ */}
        {hasAtencao && (
          <section className="animate-fade-up" style={{ animationDelay: "240ms" }}>
            <SectionLabel>04 · Pontos de Atenção</SectionLabel>
            <div className="space-y-3">
              {atencao.map((item, i) => (
                <ContratualCard key={i} item={item} idx={i} />
              ))}
            </div>
          </section>
        )}

        {/* ============ ANÁLISE CONTRATUAL / LEGAL ============ */}
        {hasContratual && (
          <section className="animate-fade-up" style={{ animationDelay: "200ms" }}>
            <SectionLabel>Análise Contratual / Legal</SectionLabel>
            <div className="space-y-3">
              {data.analise_contratual!.map((item, i) => (
                <ContratualCard key={i} item={item} idx={i} />
              ))}
            </div>
          </section>
        )}

        {/* ============ MATRIZ DE RISCO PATRIMONIAL ============ */}
        {hasMatriz && (
          <section className="animate-fade-up" style={{ animationDelay: "280ms" }}>
            <SectionLabel>Matriz de Risco Patrimonial</SectionLabel>
            <div className="bg-card rounded-2xl border border-border shadow-sm px-5 md:px-7">
              {data.matriz_risco!.map((item, i, arr) => (
                <RiscoRow key={i} item={item} isLast={i === arr.length - 1} />
              ))}
            </div>
          </section>
        )}

        {/* ============ ESTRATÉGIA DE DEFESA RECOMENDADA ============ */}
        {hasEstrategia && (
          <section className="animate-fade-up" style={{ animationDelay: "360ms" }}>
            <SectionLabel>Estratégia de Defesa Recomendada</SectionLabel>
            <EstrategiaCard passos={data.estrategia_defesa!} />
          </section>
        )}

        {/* ============ PRÓXIMO PASSO ============ */}
        {data.proximo_passo && (
          <article className="lvb-card overflow-hidden animate-fade-up" style={{ animationDelay: "440ms" }}>
            <div className="relative bg-gradient-to-r from-primary via-primary to-[#4A0D17] text-primary-foreground px-6 py-5 md:px-8 md:py-6 overflow-hidden">
              <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-gold/10 blur-2xl" />
              <div className="relative flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-primary-foreground/10 border border-primary-foreground/15 flex items-center justify-center shrink-0 backdrop-blur-sm">
                    <Compass className="w-5 h-5 md:w-6 md:h-6 text-gold-light" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] md:text-xs font-semibold tracking-[0.25em] uppercase text-gold-light/80">
                      Bloco 05
                    </p>
                    <h2 className="font-serif-lvb text-xl md:text-3xl font-bold leading-tight truncate">
                      Próximo Passo
                    </h2>
                  </div>
                </div>
                <span className="font-serif-lvb text-4xl md:text-6xl text-primary-foreground/10 font-bold leading-none select-none">
                  05
                </span>
              </div>
            </div>
            <div className="p-6 md:p-8 lg:p-10 bg-card relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-gold via-gold-light to-transparent opacity-60" />
              <RichContent text={data.proximo_passo} />
            </div>
          </article>
        )}

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
                className="btn-cta mt-8 pill bg-white text-[#0D4A20] hover:bg-white/95 px-8 py-4 font-bold inline-flex items-center gap-2 shadow-2xl"
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
                className="btn-cta mt-8 pill bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 font-bold inline-flex items-center gap-2 shadow-2xl"
              >
                <MessageCircle className="w-5 h-5" /> Falar com Nossa Equipe
              </a>
            </div>
          </div>
        )}

        {/* Nova Análise */}
        <div className="text-center pt-4">
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("lvb_usado");
              localStorage.removeItem("lvb_analise");
              window.location.href = CAKTO_LINK;
            }}
            className="pill border-2 border-primary/30 bg-card hover:bg-primary/5 text-primary px-6 py-3 font-semibold inline-flex items-center gap-2 transition-colors"
          >
            Fazer Nova Análise <ArrowRight className="w-4 h-4" />
          </button>
          <p className="mt-2 text-xs text-muted-foreground">
            Nova análise por R$ 29,90
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
