import { Link } from "react-router-dom";
import { ArrowRight, Check, Lock, Shield, Sparkles } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { CAKTO_LINK } from "@/lib/lvb-constants";

const recognize = [
  "Minha dívida cresce todo mês mesmo pagando em dia...",
  "Não sei se tenho direito a reduzir os juros que estão cobrando...",
  "Já tentei negociar mas o banco não ofereceu desconto real...",
  "Tenho medo de tomar a decisão errada e piorar a situação...",
  "Quero limpar meu nome mas não sei por onde começar...",
];

const steps = [
  { n: "1", t: "Preencha", s: "Formulário em menos de 5 min" },
  { n: "2", t: "Analisamos", s: "Com base na sua situação real" },
  { n: "3", t: "Descubra", s: "Seu potencial de negociação" },
  { n: "4", t: "Receba", s: "Orientação personalizada" },
];

const includes = [
  "Verificação da Lei do Superendividamento",
  "Análise de viabilidade de revisão contratual",
  "Identificação de juros abusivos",
  "Risco de bloqueio de bens e contas",
  "Orientação sobre ações de cobrança",
  "Recomendações personalizadas para o seu perfil",
];

const benefits = [
  "Análise completa e personalizada",
  "Análise de redução de juros e dívidas",
  "Verificação da Lei do Superendividamento",
  "Estratégia de ação para o seu perfil",
  "Resultado em menos de 5 minutos por e-mail",
];

const Sales = () => {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO */}
      <section className="container max-w-6xl py-14 md:py-24 relative overflow-hidden">
        {/* decorative background glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-gold/5 blur-3xl -z-10" />

        <div className="max-w-3xl mx-auto text-center animate-fade-up">
          <span className="inline-flex items-center gap-2 pill bg-secondary/80 backdrop-blur text-foreground px-4 py-1.5 text-xs md:text-sm font-medium border border-border shadow-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-dot" />
            Resultado em menos de 5 minutos
          </span>
          <h1 className="font-serif-lvb mt-7 text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.02] tracking-tight">
            Descubra quanto você pode <span className="text-gradient-burgundy">reduzir</span> das suas dívidas.
          </h1>
          <p className="mt-7 text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            A metodologia LVB analisa sua situação e calcula seu potencial real de
            negociação: juros abusivos, Lei do Superendividamento, revisão contratual e mais.
          </p>

          {/* PREÇO EM DESTAQUE NO HERO */}
          <div className="mt-10 inline-flex flex-col items-center gap-1 rounded-3xl border-2 border-primary/20 bg-card px-7 py-5 shadow-[0_20px_50px_-20px_hsl(var(--primary)/0.35)] animate-scale-in" style={{ animationDelay: "200ms" }}>
            <span className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">
              Pagamento único · acesso imediato
            </span>
            <div className="font-serif-lvb font-bold leading-none flex items-baseline gap-1 mt-1">
              <span className="text-sm text-muted-foreground line-through mr-2">R$ 97</span>
              <span className="text-5xl md:text-6xl text-primary">R$ 29</span>
              <span className="text-2xl md:text-3xl text-gradient-gold">,90</span>
            </div>
            <span className="text-xs text-muted-foreground mt-2">
              Cartão · Pix · Boleto
            </span>
          </div>

          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center animate-fade-up" style={{ animationDelay: "350ms" }}>
            <a
              href={CAKTO_LINK}
              className="btn-cta pill bg-primary hover:bg-primary-hover text-primary-foreground px-7 py-4 text-base font-semibold inline-flex items-center justify-center gap-2"
            >
              Quero minha análise por R$ 29,90 <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="#como-funciona"
              className="pill border border-border bg-card hover:bg-secondary hover:border-primary/30 px-7 py-4 text-base font-semibold transition-all hover:-translate-y-0.5"
            >
              Como funciona
            </a>
          </div>

          <div className="mt-8 flex flex-wrap gap-2 justify-center text-xs animate-fade-up" style={{ animationDelay: "500ms" }}>
            {["Análise personalizada", "Sigiloso", "Resultado na hora + e-mail"].map((p) => (
              <span key={p} className="pill bg-secondary/70 px-3 py-1.5 border border-border text-muted-foreground">
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* RECONHECE */}
      <section className="bg-beige-deep py-16 md:py-24">
        <div className="container max-w-4xl">
          <h2 className="font-serif-lvb text-3xl md:text-5xl font-bold text-center leading-tight">
            São situações como essas que <span className="text-primary">analisamos todos os dias</span>
          </h2>
          <div className="mt-10 space-y-3">
            {recognize.map((q) => (
              <div key={q} className="lvb-card p-5 md:p-6 flex items-start gap-3">
                <span className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />
                <p className="text-foreground/90 italic">{q}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="py-16 md:py-24 bg-card">
        <div className="container max-w-5xl">
          <h2 className="font-serif-lvb text-3xl md:text-5xl font-bold text-center">Simples assim</h2>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {steps.map((s) => (
              <div key={s.n} className="lvb-card p-6 flex gap-5 items-start hover:-translate-y-1 transition-transform">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground font-serif-lvb text-2xl font-bold flex items-center justify-center shrink-0">
                  {s.n}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{s.t}</h3>
                  <p className="text-muted-foreground mt-1">{s.s}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* O QUE INCLUI */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container max-w-3xl">
          <h2 className="font-serif-lvb text-3xl md:text-5xl font-bold text-center">
            Sua análise <span className="text-primary">analisa tudo isso</span>
          </h2>
          <ul className="mt-10 space-y-3">
            {includes.map((i) => (
              <li key={i} className="lvb-card px-5 py-4 flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                <span className="font-medium">{i}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* PREVIEW */}
      <section className="py-16 md:py-24 bg-beige-deep">
        <div className="container max-w-3xl">
          <h2 className="font-serif-lvb text-3xl md:text-5xl font-bold text-center">
            Veja como sua análise chega para você
          </h2>
          <div className="mt-10 lvb-card overflow-hidden">
            <div className="bg-[#1A1005] text-primary-foreground p-5 flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-gold-light animate-pulse-dot" />
              <span className="font-semibold text-sm">Análise sendo gerada...</span>
            </div>
            <div className="p-6 md:p-8 space-y-5">
              <div>
                <div className="flex justify-between text-sm font-semibold mb-2">
                  <span>Potencial de redução</span>
                  <span className="text-primary">72%</span>
                </div>
                <div className="h-3 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: "72%", background: "var(--gradient-progress)" }} />
                </div>
              </div>
              <div className="space-y-2.5 select-none" style={{ filter: "blur(5px)" }}>
                <div className="h-3 bg-secondary rounded w-full" />
                <div className="h-3 bg-secondary rounded w-11/12" />
                <div className="h-3 bg-secondary rounded w-10/12" />
                <div className="h-3 bg-secondary rounded w-9/12" />
              </div>
              <div className="pt-2 flex flex-col items-center gap-3">
                <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Liberar resultado completo
                </p>
                <a
                  href={CAKTO_LINK}
                  className="pill bg-primary hover:bg-primary-hover text-primary-foreground px-6 py-3 font-semibold inline-flex items-center gap-2 transition-colors"
                >
                  Ver minha análise agora <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PREÇO */}
      <section className="py-16 md:py-24 bg-beige-deep">
        <div className="container max-w-xl">
          <h2 className="font-serif-lvb text-3xl md:text-5xl font-bold text-center">
            Por menos do que você imagina
          </h2>
          <div className="mt-10 lvb-card overflow-hidden">
            <div className="bg-[#1A1005] text-primary-foreground p-5 text-center">
              <span className="text-xs uppercase tracking-widest text-gold-light font-semibold">Pagamento único</span>
            </div>
            <div className="p-8 text-center">
              <div className="font-serif-lvb font-bold leading-none">
                <span className="text-5xl">R$ 29</span>
                <span className="text-3xl text-gradient-gold">,90</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                cartão, boleto ou Pix · acesso imediato
              </p>
              <ul className="mt-6 space-y-3 text-left">
                {benefits.map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </span>
                    <span className="text-sm">{b}</span>
                  </li>
                ))}
              </ul>
              <a
                href={CAKTO_LINK}
                className="mt-7 pill bg-primary hover:bg-primary-hover text-primary-foreground w-full px-6 py-4 font-semibold inline-flex items-center justify-center gap-2 transition-colors"
              >
                Fazer análise agora <ArrowRight className="w-5 h-5" />
              </a>
              <p className="text-xs text-muted-foreground mt-3 inline-flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Garantia de 7 dias
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CITAÇÃO */}
      <section className="bg-primary text-primary-foreground py-16 md:py-24 relative overflow-hidden">
        <div className="absolute top-6 left-6 w-10 h-10 border-l-2 border-t-2 border-gold" />
        <div className="absolute bottom-6 right-6 w-10 h-10 border-r-2 border-b-2 border-gold" />
        <div className="container max-w-3xl text-center">
          <Sparkles className="w-8 h-8 text-gold-light mx-auto mb-4" />
          <p className="font-serif-lvb italic text-2xl md:text-3xl leading-relaxed">
            "Em menos de 5 minutos você tem na mão uma análise completa da sua situação,
            com um caminho claro e personalizado para seguir."
          </p>
          <p className="mt-6 text-sm uppercase tracking-widest text-gold-light">
            Análise de Dívida Bancária — LVB
          </p>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 bg-background text-center">
        <div className="container max-w-2xl">
          <h2 className="font-serif-lvb text-3xl md:text-5xl font-bold">
            O primeiro passo é entender sua situação
          </h2>
          <a
            href={CAKTO_LINK}
            className="mt-8 pill bg-primary hover:bg-primary-hover text-primary-foreground px-8 py-4 text-lg font-semibold inline-flex items-center gap-2 transition-colors"
          >
            Fazer análise agora <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default Sales;
