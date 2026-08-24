import { Link } from "react-router-dom";
import { ArrowRight, Check, Lock, Shield, MessageCircle } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { CAKTO_LINK, WHATSAPP_LINK } from "@/lib/lvb-constants";
import larissaFoto from "@/assets/larissa-brandao.jpg";

const recognize = [
  "Minha dívida cresce todo mês mesmo pagando em dia...",
  "Não sei se tenho direito a reduzir os juros que estão cobrando...",
  "Já tentei negociar mas o banco não ofereceu desconto real...",
  "Tenho medo de tomar a decisão errada e piorar a situação...",
  "Quero limpar meu nome mas não sei por onde começar...",
];

const steps = [
  { n: "01", t: "Preencha", s: "Formulário em menos de 5 min" },
  { n: "02", t: "Analisamos", s: "Com base na sua situação real" },
  { n: "03", t: "Descubra", s: "Seu potencial de negociação" },
  { n: "04", t: "Receba", s: "Orientação personalizada" },
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
    <div className="min-h-screen bg-background selection:bg-gold/30">
      <SiteHeader />

      {/* HERO */}
      <section className="relative px-6 pt-14 md:pt-20 pb-16 md:pb-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl -z-10" />
        <div className="max-w-3xl mx-auto text-center animate-fade-up">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/40 bg-card/60 backdrop-blur-sm text-[10px] md:text-xs font-semibold tracking-[0.18em] uppercase text-primary">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-dot" />
            Quanto mais o tempo passa, mais sua dívida pode crescer
          </span>

          <h1 className="font-serif-lvb mt-8 text-4xl md:text-6xl font-bold leading-[1.15] text-foreground">
            Você pode estar pagando{" "}
            <span className="text-primary italic">mais do que deveria</span>{" "}
            e ainda não percebeu.
          </h1>

          <p className="mt-6 text-base md:text-lg text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto">
            Uma análise inicial que avalia sua dívida, seus riscos e possíveis caminhos
            para você entender melhor a sua situação antes de tomar qualquer decisão.
          </p>

          {/* CARD DE PREÇO — estilo editorial com faixa superior vinho */}
          <div className="mt-12 max-w-md mx-auto animate-scale-in" style={{ animationDelay: "200ms" }}>
            <div className="relative bg-card border border-gold/25 rounded-3xl shadow-[0_20px_50px_rgba(36,13,19,0.06)] p-8 pt-10 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-gold to-primary" />
              <span className="absolute top-4 right-4 bg-gold text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                Oferta limitada
              </span>
              <p className="text-[10px] md:text-xs uppercase tracking-[0.25em] text-muted-foreground font-semibold">
                Análise inicial · acesso imediato
              </p>
              <p className="text-sm text-muted-foreground line-through mt-3">De R$ 200,00</p>
              <div className="flex flex-col items-center mt-1 mb-6">
                <span className="font-serif-lvb text-lg font-light text-primary">por apenas</span>
                <span className="font-serif-lvb text-5xl md:text-6xl font-bold text-primary tracking-tight whitespace-nowrap">
                  R$ 29<span className="text-gold">,90</span>
                </span>
              </div>
              <a
                href={CAKTO_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-cta block w-full bg-primary hover:bg-ink text-primary-foreground py-4 px-6 text-sm font-bold tracking-[0.12em] uppercase"
              >
                Quero entender minha situação
              </a>
              <p className="text-[11px] text-muted-foreground uppercase tracking-widest mt-4">
                Cartão · Pix · Boleto
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2 justify-center text-xs animate-fade-up" style={{ animationDelay: "400ms" }}>
            {["Análise personalizada", "Sigiloso", "Resultado na hora + e-mail"].map((p) => (
              <span key={p} className="px-4 py-1.5 rounded-full border border-gold/30 bg-card/60 text-muted-foreground tracking-wide">
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* AVISO IMPORTANTE PÓS-PAGAMENTO */}
      <section className="bg-gold/10 border-y border-gold/25 py-8">
        <div className="container max-w-3xl flex items-start gap-4">
          <Shield className="w-6 h-6 text-primary shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="font-serif-lvb text-lg font-bold text-primary">Aviso importante sobre o pagamento</h3>
            <p className="text-foreground/75 text-sm leading-relaxed">
              Após o pagamento, a Kiwify envia um e-mail ou mensagem no WhatsApp apenas confirmando o recebimento. Essa mensagem não libera a análise.
            </p>
            <p className="text-foreground/75 text-sm leading-relaxed">
              Em seguida, você recebe por e-mail um <strong className="text-primary">código de acesso</strong> (seu crédito). Volte a este site e use o código para preencher o formulário — é só assim que sua análise é liberada. O código não expira: se a página fechar, é só voltar e digitá-lo de novo.
            </p>
            <Link
              to="/formulario"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline underline-offset-4 decoration-gold hover:text-ink transition-colors"
            >
              Já tenho meu código — preencher formulário
            </Link>
          </div>
        </div>
      </section>

      {/* RECONHECE — lista numerada editorial */}
      <section className="py-16 md:py-24 bg-beige-deep/60">
        <div className="container max-w-3xl">
          <h2 className="font-serif-lvb text-3xl md:text-4xl font-bold text-center leading-snug">
            São situações como essas que{" "}
            <span className="text-primary italic">analisamos todos os dias</span>
          </h2>
          <ul className="mt-12 border-t border-gold/25">
            {recognize.map((q, i) => (
              <li
                key={q}
                className="flex gap-5 items-baseline py-5 border-b border-gold/25 animate-fade-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span className="font-serif-lvb text-gold text-xl shrink-0">
                  {String(i + 1).padStart(2, "0")}.
                </span>
                <p className="text-foreground/85 italic text-[15px] md:text-lg leading-relaxed">{q}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="py-16 md:py-24 bg-card border-y border-border">
        <div className="container max-w-5xl">
          <p className="text-center text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase text-gold">
            Método LVB
          </p>
          <h2 className="font-serif-lvb mt-3 text-3xl md:text-4xl font-bold text-center">Simples assim</h2>
          <p className="mt-4 text-center text-muted-foreground font-light max-w-xl mx-auto">
            Quatro passos para você ter clareza sobre suas opções.
          </p>
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 gap-px bg-gold/25 border border-gold/25 rounded-3xl overflow-hidden">
            {steps.map((s, i) => (
              <div
                key={s.n}
                className="bg-card p-7 md:p-9 animate-fade-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <span className="font-serif-lvb italic text-4xl text-gold block">{s.n}.</span>
                <h3 className="font-serif-lvb text-xl font-bold mt-4">{s.t}</h3>
                <p className="text-muted-foreground font-light mt-2">{s.s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* O QUE INCLUI */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container max-w-3xl">
          <h2 className="font-serif-lvb text-3xl md:text-4xl font-bold text-center leading-snug">
            Sua análise <span className="text-primary italic">cobre tudo isso</span>
          </h2>
          <ul className="mt-12 grid sm:grid-cols-2 gap-x-10">
            {includes.map((i, idx) => (
              <li
                key={i}
                className="flex items-start gap-3 py-4 border-b border-gold/25 animate-fade-up"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <span className="mt-1.5 w-4 h-4 rounded-full border border-gold text-gold flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5" strokeWidth={3.5} />
                </span>
                <span className="font-medium text-[15px]">{i}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* QUEM EMBASA A ANÁLISE — seção vinho */}
      <section className="bg-primary text-primary-foreground py-16 md:py-24">
        <div className="container max-w-5xl">
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
            <div className="w-64 md:w-72 shrink-0">
              <div className="aspect-[4/5] overflow-hidden rounded-[2rem] border-4 border-gold/50 bg-secondary shadow-[0_24px_60px_-20px_rgba(0,0,0,0.45)]">
                <img
                  src={larissaFoto}
                  alt="Larissa Brandão, advogada especialista em Direito Bancário"
                  className="w-full h-full object-cover object-[55%_80%] scale-[1.15] origin-[55%_80%]"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="text-center md:text-left">
              <p className="text-gold-light font-semibold tracking-[0.25em] text-[10px] md:text-xs uppercase">
                Quem embasa a análise
              </p>
              <h2 className="font-serif-lvb mt-3 text-3xl md:text-4xl font-bold">
                Larissa Brandão
              </h2>
              <p className="mt-2 text-gold-light text-xs md:text-sm font-medium tracking-wider uppercase">
                Advogada · Direito Bancário e do Consumidor
              </p>
              <p className="mt-6 text-primary-foreground/85 font-light leading-relaxed text-base md:text-lg">
                Atuo na defesa de consumidores contra abusos de instituições financeiras,
                com foco na análise estratégica de contratos, juros e cobranças indevidas.
                Meu objetivo é te ajudar a entender exatamente o que você está pagando e
                identificar possíveis irregularidades, para que você tome decisões mais
                seguras e evite prejuízos.
              </p>
              <p className="mt-4 text-sm text-primary-foreground/60 italic font-light">
                Cada análise é construída com base no método e na experiência prática do
                escritório LVB no atendimento de centenas de casos de superendividamento.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 justify-center md:justify-start">
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-gold/50 text-gold-light hover:bg-gold hover:text-ink px-7 py-3 text-xs font-bold tracking-[0.15em] uppercase inline-flex items-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" /> Falar com o escritório
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PREVIEW — moldura dourada deslocada */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container max-w-3xl">
          <h2 className="font-serif-lvb text-3xl md:text-4xl font-bold text-center leading-snug">
            Veja como sua análise <span className="text-primary italic">chega para você</span>
          </h2>
          <div className="mt-12 relative">
            <div className="absolute -inset-3 border border-gold/40 translate-x-3 translate-y-3 pointer-events-none" />
            <div className="relative lvb-card overflow-hidden">
              <div className="bg-ink text-ink-foreground px-5 py-4 flex items-center gap-3 border-b border-gold/25">
                <span className="w-2.5 h-2.5 rounded-full bg-gold-light animate-pulse-dot" />
                <span className="font-semibold text-sm tracking-wide">Análise sendo gerada...</span>
              </div>
              <div className="p-6 md:p-8 space-y-4">
                {[
                  { n: "01", t: "Resumo da Situação" },
                  { n: "02", t: "Seus Direitos" },
                  { n: "03", t: "Estratégia Recomendada" },
                  { n: "04", t: "Pontos de Atenção" },
                  { n: "05", t: "Próximo Passo" },
                ].map((item, idx) => (
                  <div key={item.n} className="flex items-start gap-3">
                    <span className="font-serif-lvb italic text-sm text-gold shrink-0 mt-0.5">
                      {item.n}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm md:text-base">{item.t}</p>
                      <div
                        className="mt-2 space-y-1.5 select-none"
                        style={{ filter: idx === 0 ? "blur(3px)" : "blur(5px)" }}
                      >
                        <div className="h-2 bg-secondary rounded-none w-full" />
                        <div className="h-2 bg-secondary rounded-none w-10/12" />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="pt-4 flex flex-col items-center gap-3 border-t border-gold/25 mt-2">
                  <p className="text-sm text-muted-foreground inline-flex items-center gap-2 mt-3">
                    <Lock className="w-4 h-4" /> Liberar análise completa
                  </p>
                  <a
                    href={CAKTO_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-cta bg-primary hover:bg-ink text-primary-foreground px-6 py-3 text-sm font-bold tracking-[0.12em] uppercase inline-flex items-center gap-2"
                  >
                    Quero entender minha situação <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PREÇO */}
      <section className="py-16 md:py-24 bg-beige-deep/60 border-y border-gold/20">
        <div className="container max-w-xl">
          <h2 className="font-serif-lvb text-3xl md:text-4xl font-bold text-center leading-snug">
            Por menos do que <span className="text-primary italic">você imagina</span>
          </h2>
          <div className="mt-10 relative">
            <div className="absolute -inset-3 border border-gold/40 -translate-x-3 translate-y-3 pointer-events-none" />
            <div className="relative bg-card border border-gold/25 shadow-[0_20px_50px_rgba(36,13,19,0.06)] p-8 md:p-10">
              <div className="text-center">
                <span className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">Pagamento único</span>
                <div className="font-serif-lvb font-bold leading-none mt-3">
                  <span className="text-5xl md:text-6xl text-primary">R$ 29<span className="text-gold">,90</span></span>
                </div>
                <p className="text-sm text-muted-foreground font-light mt-3">
                  cartão, boleto ou Pix · acesso imediato
                </p>
              </div>
              <ul className="mt-8 space-y-3">
                {benefits.map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <span className="mt-0.5 w-5 h-5 border border-primary text-primary flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </span>
                    <span className="text-sm">{b}</span>
                  </li>
                ))}
              </ul>
              <a
                href={CAKTO_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-cta mt-8 block w-full bg-primary hover:bg-ink text-primary-foreground px-6 py-4 text-sm font-bold tracking-[0.12em] uppercase text-center"
              >
                Fazer análise agora
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CITAÇÃO */}
      <section className="py-16 md:py-24 bg-card">
        <div className="container max-w-3xl text-center">
          <svg className="w-10 h-10 text-gold mx-auto mb-8 opacity-50" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14.017 21L14.017 18C14.017 16.9 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.55 20.017 15V9C20.017 8.45 19.5693 8 19.017 8H15.017C14.4647 8 14.017 8.45 14.017 9V11C14.017 11.55 13.5693 12 13.017 12H12.017V4H22.017V15C22.017 18.31 19.3307 21 16.017 21H14.017ZM2.017 21L2.017 18C2.017 16.9 2.91243 16 4.017 16H7.017C7.56928 16 8.017 15.55 8.017 15V9C8.017 8.45 7.56928 8 7.017 8H3.017C2.46472 8 2.017 8.45 2.017 9V11C2.017 11.55 1.56928 12 1.017 12H0.017V4H10.017V15C10.017 18.31 7.33072 21 4.017 21H2.017Z" />
          </svg>
          <p className="font-serif-lvb italic text-2xl md:text-3xl text-primary leading-relaxed">
            "Em menos de 5 minutos você tem na mão uma análise completa da sua situação,
            com um caminho claro e personalizado para seguir."
          </p>
          <p className="mt-6 text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-gold">
            Análise de Dívida Bancária — LVB
          </p>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 md:py-28 bg-background text-center border-t border-gold/20">
        <div className="container max-w-2xl">
          <p className="text-gold text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase">
            Decisão estratégica
          </p>
          <h2 className="font-serif-lvb mt-4 text-3xl md:text-4xl font-bold leading-snug">
            O primeiro passo é <span className="text-primary italic">entender sua situação</span>
          </h2>
          <a
            href={CAKTO_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-cta mt-10 bg-primary hover:bg-ink text-primary-foreground px-10 py-5 text-sm font-bold tracking-[0.15em] uppercase inline-flex items-center gap-2"
          >
            Fazer análise por R$ 29,90 <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default Sales;
