import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowRight, MessageCircle, FileText, Scale, Target, AlertTriangle, Compass } from "lucide-react";
import { LvbLogo } from "@/components/LvbLogo";
import { SiteFooter } from "@/components/SiteChrome";
import { COURSE_LINK, WHATSAPP_LINK } from "@/lib/lvb-constants";

const blocks = [
  { n: "01", t: "Resumo da Situação", icon: FileText },
  { n: "02", t: "Seus Direitos", icon: Scale },
  { n: "03", t: "Estratégia Recomendada", icon: Target },
  { n: "04", t: "Pontos de Atenção", icon: AlertTriangle },
  { n: "05", t: "Próximo Passo", icon: Compass },
];

const SECTION_TITLES = [
  "RESUMO DA SITUAÇÃO",
  "SEUS DIREITOS",
  "ESTRATÉGIA RECOMENDADA",
  "PONTOS DE ATENÇÃO",
  "PRÓXIMO PASSO",
];

const strip = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

const splitAnalise = (raw: string): string[] => {
  if (!raw) return [];
  const result: string[] = ["", "", "", "", ""];

  // Captura marcadores "1." "1)" "01." "**1.**" "#1" "BLOCO 1" no início de linha
  const re = /(?:^|\n)\s*(?:\*+|#+)?\s*(?:BLOCO\s*)?0?([1-5])[\.\)\-:]\s*([^\n]*)/gi;
  const matches: { idx: number; start: number; headerEnd: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
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
      const body = raw.slice(cur.headerEnd, next ? next.start : raw.length);
      const cleaned = body.replace(/^\**\s*/, "").replace(/\*\*/g, "").trim();
      if (!result[cur.idx]) result[cur.idx] = cleaned;
    }
    if (result.some((s) => s)) return result;
  }

  // Fallback: split pelos títulos em caixa alta
  const stripped = strip(raw);
  for (let i = 0; i < SECTION_TITLES.length; i++) {
    const titleStripped = strip(SECTION_TITLES[i]);
    const pos = stripped.indexOf(titleStripped);
    if (pos >= 0) {
      const nextPos =
        i + 1 < SECTION_TITLES.length
          ? stripped.indexOf(strip(SECTION_TITLES[i + 1]), pos + titleStripped.length)
          : -1;
      const end = nextPos > 0 ? nextPos : raw.length;
      const slice = raw.slice(pos + titleStripped.length, end);
      result[i] = slice.replace(/^[\s:\-*#\n]+/, "").replace(/\*\*/g, "").trim();
    }
  }
  if (result.some((s) => s)) return result;

  // Último recurso: divide por parágrafos em 5 grupos
  const paras = raw.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
  if (paras.length <= 1) return [raw, "", "", "", ""];
  const chunkSize = Math.ceil(paras.length / 5);
  return Array.from({ length: 5 }, (_, i) =>
    paras.slice(i * chunkSize, (i + 1) * chunkSize).join("\n\n"),
  );
};

const Analise = () => {
  const [analiseParts, setAnaliseParts] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [total, setTotal] = useState("");
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let raw = localStorage.getItem("lvb_analise") || "";
    const e = localStorage.getItem("lvb_email") || "";
    const n = localStorage.getItem("lvb_nome") || "";
    const t = localStorage.getItem("lvb_total_dividas") || "";
    setEmail(e); setNome(n); setTotal(t);

    // Se o n8n devolveu a expressão literal (não avaliada), descarta o conteúdo
    if (/\{\{\s*\$?\(?['"]?[\w$]+/.test(raw) && raw.includes("}}")) {
      raw = "";
    }

    if (!raw && !e) { setMissing(true); return; }
    setAnaliseParts(splitAnalise(raw));
  }, []);

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
          <Link to="/formulario" className="mt-6 pill bg-primary hover:bg-primary-hover text-primary-foreground px-6 py-3 font-semibold inline-flex items-center gap-2 transition-colors">
            Refazer formulário <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="bg-[#1A1005] text-primary-foreground py-12 md:py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ background: "var(--gradient-burgundy)" }} />
        <div className="container max-w-4xl relative">
          <div className="flex justify-center mb-6"><LvbLogo size="md" className="brightness-110" /></div>
          <span className="mx-auto block w-fit pill bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 px-4 py-1.5 text-xs font-semibold">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse-dot" />
            Análise gerada com sucesso
          </span>
          <h1 className="font-serif-lvb mt-5 text-3xl md:text-5xl font-bold text-center leading-tight">
            {nome ? `${nome.split(" ")[0]}, ` : ""}sua análise de dívida bancária está pronta
          </h1>
          <p className="mt-4 text-center text-primary-foreground/70 max-w-2xl mx-auto">
            Análise elaborada com base nas informações fornecidas.
          </p>
        </div>
      </header>

      <main className="container max-w-3xl -mt-6 relative z-10 pb-16 space-y-5">
        {/* ALERTA EMAIL + RESULTADO IMEDIATO */}
        {email && (
          <div className="lvb-card border-2 border-emerald-400/40 bg-emerald-50/60 p-5 flex gap-4 items-start">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-700 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="text-sm md:text-base">
              <p className="font-semibold text-emerald-900">
                Sua análise está disponível agora nesta tela.
              </p>
              <p className="mt-1 text-foreground/80">
                Uma cópia também foi enviada para <strong>{email}</strong>. Verifique também a pasta de spam.
              </p>
            </div>
          </div>
        )}

        {/* BLOCOS */}
        {blocks.map((b, i) => {
          const I = b.icon;
          const content = analiseParts[i] || "Sua análise está sendo processada e será enviada por e-mail em instantes.";
          return (
            <article key={b.n} className="lvb-card overflow-hidden animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
              <header className="bg-primary text-primary-foreground p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
                    <I className="w-5 h-5" />
                  </div>
                  <h2 className="font-serif-lvb text-xl md:text-2xl font-bold">{b.t}</h2>
                </div>
                <span className="font-serif-lvb text-3xl md:text-4xl text-gold-light/80 font-bold">{b.n}</span>
              </header>
              <div className="p-6 md:p-7 whitespace-pre-line text-foreground/90 leading-relaxed">
                {content}
              </div>
            </article>
          );
        })}

        {/* CTA SEGMENTADO */}
        {isLowDebt ? (
          <div className="rounded-2xl bg-[#0D4A20] text-white p-7 md:p-9 text-center shadow-deep relative overflow-hidden">
            <span className="pill bg-emerald-300/20 border border-emerald-300/40 text-emerald-100 px-3 py-1 text-xs font-semibold">
              Indicado para o seu perfil
            </span>
            <h3 className="font-serif-lvb mt-4 text-2xl md:text-3xl font-bold leading-tight">
              Aprenda a negociar sua dívida e consiga até 90% de desconto
            </h3>
            <p className="mt-3 text-white/80 max-w-xl mx-auto">
              Curso completo com método LVB para você renegociar com força e conhecimento dos seus direitos.
            </p>
            <a href={COURSE_LINK} className="mt-6 pill bg-white text-[#0D4A20] hover:bg-white/90 px-7 py-4 font-bold inline-flex items-center gap-2 transition-colors">
              Acessar o Curso Agora <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        ) : (
          <div className="rounded-2xl bg-primary text-primary-foreground p-7 md:p-9 text-center shadow-deep">
            <span className="pill bg-gold/20 border border-gold/40 text-gold-light px-3 py-1 text-xs font-semibold">
              Atendimento personalizado
            </span>
            <h3 className="font-serif-lvb mt-4 text-2xl md:text-3xl font-bold leading-tight">
              Seu caso merece atenção especializada
            </h3>
            <p className="mt-3 text-primary-foreground/80 max-w-xl mx-auto">
              Nossa equipe está pronta para conduzir seu caso com a estratégia certa para sua situação.
            </p>
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer"
              className="mt-6 pill bg-emerald-500 hover:bg-emerald-600 text-white px-7 py-4 font-bold inline-flex items-center gap-2 transition-colors">
              <MessageCircle className="w-5 h-5" /> Falar com Nossa Equipe
            </a>
          </div>
        )}

        {/* AVISO LGPD */}
        <div className="bg-secondary/60 border border-border rounded-xl p-4 text-xs text-muted-foreground text-center">
          Esta análise é informativa e não constitui orientação formal. Suas informações foram tratadas com total confidencialidade.
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Analise;
