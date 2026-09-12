import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  CreditCard,
  ListChecks,
  Mail,
  Quote,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { LvbLogo } from "@/components/LvbLogo";
import { SiteFooter } from "@/components/SiteChrome";
import { COURSE_LINK } from "@/lib/lvb-constants";

type DividaResultado = {
  modalidade?: string;
  instituicao?: string;
  atraso?: string;
};

type Resultado = {
  identificacao?: { nome_completo?: string; email?: string };
  renda?: { valor_total_dividas?: string };
  dividas?: DividaResultado[];
  objetivo?: { urgencia?: string[] };
};

const VALORES: Record<string, string> = {
  ate_10k: "Até R$ 10.000",
  "10k_30k": "De R$ 10.001 a R$ 30.000",
  "30k_60k": "De R$ 30.001 a R$ 60.000",
  "60k_100k": "De R$ 60.001 a R$ 100.000",
  "100k_300k": "De R$ 100.001 a R$ 300.000",
  "300k_500k": "De R$ 300.001 a R$ 500.000",
  acima_500k: "Acima de R$ 500.000",
  nao_sei: "Não informado",
};

const ATRASOS: Record<string, { label: string; ordem: number }> = {
  em_dia: { label: "Está em dia", ordem: 0 },
  ate_30d: { label: "Até 30 dias", ordem: 1 },
  "31_90d": { label: "De 31 a 90 dias", ordem: 2 },
  "91_180d": { label: "De 91 a 180 dias", ordem: 3 },
  "6m_1a": { label: "De 6 meses a 1 ano", ordem: 4 },
  "1a_3a": { label: "De 1 a 3 anos", ordem: 5 },
  "3a_5a": { label: "De 3 a 5 anos", ordem: 6 },
  mais_5a: { label: "Mais de 5 anos", ordem: 7 },
};

const URGENCIAS: Record<string, string> = {
  nao_perder_carro: "Não perder meu carro",
  nao_perder_imovel: "Não perder meu imóvel",
  parar_cobranca: "Parar as cobranças e as ligações",
  desbloquear_conta: "Desbloquear minha conta ou parar penhora",
  reduzir_divida: "Diminuir o valor total da dívida",
  limpar_nome: "Limpar meu nome",
  reduzir_desconto: "Diminuir o desconto no meu salário ou benefício",
  sair_processo: "Sair do processo que eu já tenho",
  organizar: "Organizar tudo e voltar a respirar",
};

const MODALIDADES: Record<string, { label: string; desc: string; level: "alta" | "media" | "baixa" }> = {
  cartao_credito: { label: "Cartão de crédito", desc: "Composição de encargos a verificar", level: "media" },
  cheque_especial: { label: "Cheque especial", desc: "Composição de encargos a verificar", level: "media" },
  emprestimo_pessoal: { label: "Empréstimo pessoal", desc: "Contrato a revisar", level: "media" },
  consignado: { label: "Empréstimo consignado", desc: "Margem a conferir", level: "media" },
  cartao_consignado: { label: "Cartão consignado ou cartão benefício", desc: "Margem a conferir", level: "media" },
  financiamento_veiculo: { label: "Financiamento de veículo", desc: "Garantia vinculada ao bem", level: "alta" },
  financiamento_imovel: { label: "Financiamento de imóvel", desc: "Garantia vinculada ao bem", level: "alta" },
};

const formatarModalidade = (valor: string) =>
  MODALIDADES[valor] ?? {
    label: valor.replace(/_/g, " ").replace(/^./, (letra) => letra.toUpperCase()),
    desc: "A verificar",
    level: "media" as const,
  };

const lerResultado = (): Resultado | null => {
  try {
    const salvo = localStorage.getItem("lvb_resultado");
    return salvo ? JSON.parse(salvo) as Resultado : null;
  } catch {
    return null;
  }
};

const Analise = () => {
  const resultado = useMemo(lerResultado, []);

  if (!resultado) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="lvb-card max-w-md p-8 text-center">
          <LvbLogo size="md" className="mx-auto" />
          <h1 className="font-serif-lvb mt-6 text-2xl font-bold">Resultado não encontrado</h1>
          <p className="mt-3 text-muted-foreground">Confira seu e-mail ou volte ao formulário.</p>
          <Link to="/formulario" className="btn-cta mt-6 pill bg-primary hover:bg-primary-hover text-primary-foreground px-6 py-3 font-semibold inline-flex items-center gap-2">
            Voltar ao formulário <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const nome = resultado.identificacao?.nome_completo?.trim() ?? "";
  const firstName = nome.split(/\s+/)[0] ?? "";
  const email = resultado.identificacao?.email ?? "seu e-mail";
  const dividas = resultado.dividas ?? [];
  const instituicoes = [...new Set(dividas.map((item) => item.instituicao?.trim()).filter(Boolean))] as string[];
  const maiorAtraso = dividas.reduce(
    (maior, item) => {
      const atual = item.atraso ? ATRASOS[item.atraso] : undefined;
      return atual && atual.ordem > maior.ordem ? atual : maior;
    },
    { label: "Não informado", ordem: -1 },
  );
  const urgencias = (resultado.objetivo?.urgencia ?? []).map((item) => URGENCIAS[item] ?? item);
  const total = resultado.renda?.valor_total_dividas ?? "";
  const elegivelCurso = ["ate_10k", "10k_30k", "30k_60k"].includes(total);
  const riscos = dividas.map((item) => formatarModalidade(item.modalidade ?? "Outra dívida"));

  const resumo = [
    { icon: CreditCard, label: "Quantidade de dívidas informadas", value: String(dividas.length) },
    { icon: Building2, label: "Instituições citadas", value: instituicoes.length ? instituicoes.join(", ") : "Não informado" },
    { icon: ListChecks, label: "Faixa de valor total", value: VALORES[total] ?? "Não informado" },
    { icon: Clock3, label: "Maior tempo de atraso informado", value: maiorAtraso.label },
    { icon: Target, label: "O que você marcou como mais urgente", value: urgencias.length ? urgencias.join("; ") : "Não informado" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="relative overflow-hidden bg-ink text-ink-foreground">
        <div className="absolute inset-0 opacity-40" style={{ background: "var(--gradient-burgundy)" }} />
        <div className="container max-w-4xl relative pt-12 pb-28 md:pt-16 md:pb-36">
          <div className="flex justify-center mb-7"><LvbLogo size="md" variant="light" /></div>
          <div className="flex justify-center mb-5">
            <span className="pill bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground px-4 py-1.5 text-xs font-semibold inline-flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-gold-light" /> Análise enviada
            </span>
          </div>
          <p className="text-center text-gold-light font-semibold text-xs uppercase mb-3">Análise Personalizada</p>
          <h1 className="font-serif-lvb text-center text-4xl md:text-6xl font-bold leading-[1.08]">
            {firstName ? `${firstName}, sua análise ` : "Sua análise "}<span className="text-gradient-gold">está pronta</span>
          </h1>
          <p className="mt-5 text-center text-primary-foreground/70 max-w-2xl mx-auto text-base md:text-lg">
            Elaborada com base nas informações que você forneceu, seguindo a metodologia LVB.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-xs">
            {[{ i: ShieldCheck, t: "100% Confidencial" }, { i: Sparkles, t: "Estratégia Personalizada" }, { i: Scale, t: "Embasamento Jurídico" }].map(({ i: Icon, t }) => (
              <span key={t} className="pill bg-primary-foreground/5 border border-primary-foreground/15 px-4 py-2 text-primary-foreground/80 inline-flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 text-gold-light" /> {t}
              </span>
            ))}
          </div>
        </div>
      </header>

      <main className="container max-w-4xl -mt-16 relative z-10 pb-20 space-y-6">
        <section className="lvb-card border-2 border-gold/40 p-6 md:p-8 flex gap-4 items-start animate-fade-up" aria-labelledby="email-title">
          <div className="w-12 h-12 rounded-2xl bg-gold/15 text-primary flex items-center justify-center shrink-0"><Mail className="w-5 h-5" /></div>
          <div>
            <h2 id="email-title" className="font-serif-lvb text-xl md:text-2xl font-bold">Sua análise completa foi enviada por e-mail</h2>
            <p className="mt-2 text-foreground/75 leading-relaxed">Enviamos para <strong className="text-foreground break-all">{email}</strong>. Confira a caixa de entrada e também a aba Promoções e a pasta de spam. Deve chegar em alguns minutos.</p>
            <p className="mt-3 text-sm text-muted-foreground">Se não chegar em 15 minutos, chame no WhatsApp <a href="https://wa.me/555193782814" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline underline-offset-2">(51) 9378-2814</a>.</p>
          </div>
        </section>

        <section className="lvb-card p-6 md:p-8 bg-secondary/40 animate-fade-up">
          <Quote className="w-8 h-8 text-gold/60" />
          <p className="font-serif-lvb mt-3 text-xl md:text-2xl text-foreground/90 leading-snug italic">“Toda dívida tem uma saída — e a sua começa por entender exatamente onde você está hoje e quais são os próximos movimentos.”</p>
          <p className="mt-3 text-sm text-muted-foreground">— Equipe LVB</p>
        </section>

        <section className="lvb-card overflow-hidden animate-fade-up" aria-labelledby="resumo-title">
          <div className="bg-primary text-primary-foreground px-6 py-6 md:px-8">
            <p className="text-xs font-semibold uppercase text-gold-light">Resumo da sua situação</p>
            <h2 id="resumo-title" className="font-serif-lvb mt-1 text-2xl md:text-3xl font-bold">O que você nos contou</h2>
          </div>
          <div className="p-6 md:p-8 space-y-5">
            {resumo.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex gap-4 items-start border-b border-border pb-5 last:border-0 last:pb-0">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><Icon className="w-5 h-5" /></div>
                <div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-0.5 font-semibold text-foreground">{value}</p></div>
              </div>
            ))}
            <p className="pt-5 border-t border-border text-sm md:text-base text-foreground/75 leading-relaxed">A análise completa, com o risco de cada dívida e o que pode acontecer nos próximos meses, está no e-mail.</p>
          </div>
        </section>

        {riscos.length > 0 && (
          <section className="animate-fade-up" aria-labelledby="risco-title">
            <h2 id="risco-title" className="text-muted-foreground font-semibold text-xs uppercase mb-4 px-1">Matriz de Risco Patrimonial</h2>
            <div className="lvb-card overflow-hidden bg-card divide-y divide-border">
              {riscos.map((item, index) => {
                const dotColor = item.level === "alta" ? "bg-destructive" : item.level === "media" ? "bg-gold" : "bg-primary";
                return (
                  <div key={`${item.label}-${index}`} className="flex items-start justify-between gap-4 p-5 md:p-6">
                    <div className="min-w-0"><h3 className="font-serif-lvb font-bold text-base md:text-lg">{item.label}</h3><p className="mt-1 text-sm text-muted-foreground">{item.desc}</p></div>
                    <div className="flex gap-1.5 shrink-0 pt-1">
                      {[0, 1, 2].map((dot) => <span key={dot} className={`w-2.5 h-2.5 rounded-full ${(item.level === "alta" || (item.level === "media" && dot < 2) || (item.level === "baixa" && dot < 1)) ? dotColor : "bg-border"}`} />)}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {elegivelCurso && (
          <section className="lvb-card overflow-hidden border-2 border-gold/40 animate-fade-up">
            <div className="bg-gold text-gold-foreground px-6 py-2.5 text-center text-xs font-bold uppercase">Recomendação especial para o seu perfil</div>
            <div className="p-6 md:p-10 text-center">
              <span className="pill bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 text-xs font-semibold inline-flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" /> Método Dívida Zero</span>
              <h3 className="font-serif-lvb mt-5 text-2xl md:text-4xl font-bold leading-tight">Aprenda com a advogada Larissa Brandão</h3>
              <p className="mt-4 text-foreground/75 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">Pelo valor das dívidas que você informou, existe espaço para negociar diretamente com os credores. O Método Dívida Zero é o curso em que a advogada Larissa Brandão ensina, passo a passo, como conduzir essa negociação.</p>
              <a href={COURSE_LINK} target="_blank" rel="noopener noreferrer" className="btn-cta mt-8 pill bg-primary hover:bg-primary-hover text-primary-foreground px-7 py-4 font-semibold inline-flex items-center justify-center gap-2">Conhecer o Método Dívida Zero <ArrowRight className="w-5 h-5" /></a>
            </div>
          </section>
        )}

        <section className="relative rounded-[28px] overflow-hidden p-8 md:p-12 text-center text-primary-foreground shadow-deep animate-fade-up">
          <div className="absolute inset-0" style={{ background: "var(--gradient-burgundy)" }} />
          <div className="relative">
            <span className="pill bg-gold/25 border border-gold/40 text-gold-light px-4 py-1.5 text-xs font-semibold inline-flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5" /> Próximo passo recomendado</span>
            <h3 className="font-serif-lvb mt-5 text-3xl md:text-4xl font-bold leading-tight">Seu caso merece <span className="text-gradient-gold">atenção especializada</span></h3>
            <p className="mt-4 text-primary-foreground/80 max-w-xl mx-auto text-base md:text-lg">Recomendamos que você procure um advogado especialista em Direito Bancário e do Consumidor de sua confiança para avaliar sua situação específica.</p>
          </div>
        </section>

        <div className="bg-secondary/60 border border-border rounded-2xl p-5 text-xs md:text-sm text-muted-foreground text-center max-w-2xl mx-auto">
          <ShieldCheck className="w-4 h-4 inline mr-1.5 -mt-0.5" /> Esta análise é informativa e não constitui orientação formal. Suas informações foram tratadas com total confidencialidade conforme a LGPD.
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default Analise;