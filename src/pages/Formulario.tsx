import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, User, Users, CreditCard,
  AlertCircle, Shield, Loader2,
} from "lucide-react";
import { LvbLogo } from "@/components/LvbLogo";
import { N8N_WEBHOOK } from "@/lib/lvb-constants";
import { toast } from "@/hooks/use-toast";

type FormState = {
  nome: string; email: string; celular: string;
  situacao_cpf: string; renda_mensal: string;
  total_dividas: string; tipo_divida: string[]; bancos: string[];
  tempo_divida: string; cobranca_judicial: string;
  ja_negociou: string; objetivo: string;
  bem_garantia: string; comprometimento_renda: string;
  descricao_livre: string; lgpd: string;
};

const empty: FormState = {
  nome: "", email: "", celular: "",
  situacao_cpf: "", renda_mensal: "",
  total_dividas: "", tipo_divida: [], bancos: [],
  tempo_divida: "", cobranca_judicial: "",
  ja_negociou: "", objetivo: "",
  bem_garantia: "", comprometimento_renda: "",
  descricao_livre: "", lgpd: "",
};

const stepIcons = [User, Users, CreditCard, AlertCircle, Shield];
const stepTitles = ["Dados Pessoais", "Perfil Financeiro", "Suas Dívidas", "Situação Atual", "Garantias e Finalização"];

const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const Radio = ({ name, value, checked, onChange, label }: any) => (
  <label className={`block cursor-pointer rounded-2xl border-2 p-4 transition-all ${
    checked ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
  }`}>
    <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
    <div className="flex items-center gap-3">
      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
        checked ? "border-primary" : "border-weak"
      }`}>
        {checked && <span className="w-2.5 h-2.5 rounded-full bg-primary" />}
      </span>
      <span className="text-sm md:text-base font-medium">{label}</span>
    </div>
  </label>
);

const Check = ({ checked, onChange, label }: any) => (
  <label className={`block cursor-pointer rounded-2xl border-2 p-4 transition-all ${
    checked ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
  }`}>
    <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
    <div className="flex items-center gap-3">
      <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
        checked ? "border-primary bg-primary" : "border-weak"
      }`}>
        {checked && <svg className="w-3 h-3 text-primary-foreground" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" /></svg>}
      </span>
      <span className="text-sm md:text-base font-medium">{label}</span>
    </div>
  </label>
);

const Field = ({ label, children }: any) => (
  <div>
    <label className="block text-sm font-semibold mb-3 text-foreground">{label}</label>
    {children}
  </div>
);

const Formulario = () => {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormState>(empty);
  const [loading, setLoading] = useState(false);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) => setData((p) => ({ ...p, [k]: v }));
  const toggle = (k: "tipo_divida" | "bancos", v: string) =>
    setData((p) => ({ ...p, [k]: p[k].includes(v) ? p[k].filter((x) => x !== v) : [...p[k], v] }));

  const validateStep = (): string | null => {
    if (step === 1) {
      if (!data.nome.trim()) return "Informe seu nome";
      if (!/^\S+@\S+\.\S+$/.test(data.email)) return "E-mail inválido";
      if (data.celular.replace(/\D/g, "").length < 10) return "WhatsApp inválido";
    }
    if (step === 2 && (!data.situacao_cpf || !data.renda_mensal)) return "Responda todas as perguntas";
    if (step === 3) {
      if (!data.total_dividas) return "Informe o valor da dívida";
      if (data.tipo_divida.length === 0) return "Selecione ao menos um tipo";
      if (data.bancos.length === 0) return "Selecione ao menos um banco";
    }
    if (step === 4 && (!data.tempo_divida || !data.cobranca_judicial || !data.ja_negociou || !data.objetivo))
      return "Responda todas as perguntas";
    if (step === 5) {
      if (!data.bem_garantia || !data.comprometimento_renda) return "Responda todas as perguntas";
      if (data.lgpd !== "sim") return "Você precisa autorizar o uso dos dados (LGPD)";
    }
    return null;
  };

  const next = () => {
    const err = validateStep();
    if (err) { toast({ title: "Atenção", description: err, variant: "destructive" }); return; }
    setStep((s) => Math.min(5, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const prev = () => { setStep((s) => Math.max(1, s - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const err = validateStep();
    if (err) { toast({ title: "Atenção", description: err, variant: "destructive" }); return; }
    setLoading(true);
    try {
      localStorage.setItem("lvb_nome", data.nome);
      localStorage.setItem("lvb_email", data.email);
      localStorage.setItem("lvb_total_dividas", data.total_dividas);

      // Timeout de 90s — Claude + envio de e-mail pelo n8n pode demorar
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);

      const res = await fetch(N8N_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          ...data,
          tipo_divida: data.tipo_divida.join(", "),
          bancos: data.bancos.join(", "),
          enviado_em: new Date().toISOString(),
        }),
      }).finally(() => clearTimeout(timeoutId));

      let analise = "";
      if (res.ok) {
        const text = await res.text();
        try {
          const j = JSON.parse(text);
          analise = j.analise || j.output || j.text || "";
        } catch {
          analise = text;
        }
      }
      localStorage.setItem("lvb_analise", analise || "");
      nav("/analise");
    } catch (err) {
      // Mesmo com erro, leva pra /analise (e-mail pode chegar mesmo assim)
      localStorage.setItem("lvb_analise", "");
      toast({
        title: "Análise enviada",
        description: "Sua análise está sendo gerada e chegará por e-mail em instantes.",
      });
      nav("/analise");
    }
  };

  const Icon = stepIcons[step - 1];
  const progress = (step / 5) * 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <Loader2 className="w-14 h-14 text-primary animate-spin mx-auto" />
          <h2 className="font-serif-lvb mt-6 text-2xl md:text-3xl font-bold">Gerando sua análise...</h2>
          <p className="mt-3 text-muted-foreground">Estamos analisando sua situação. Isso leva menos de um minuto.</p>
          <div className="mt-6 flex justify-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary dot-1" />
            <span className="w-2.5 h-2.5 rounded-full bg-primary dot-2" />
            <span className="w-2.5 h-2.5 rounded-full bg-primary dot-3" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="sticky top-0 z-50 glass-header border-b border-border">
        <div className="container max-w-3xl flex items-center justify-between py-3">
          <LvbLogo size="md" />
          <span className="text-sm font-semibold text-muted-foreground">{step} de 5</span>
        </div>
      </header>

      <div className="container max-w-3xl pt-6">
        <div className="flex justify-between text-sm font-semibold mb-2">
          <span>Etapa {step} de 5</span>
          <span className="text-primary">{Math.round(progress)}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: "var(--gradient-progress)" }} />
        </div>
        <div className="mt-4 flex justify-between">
          {stepIcons.map((I, i) => {
            const done = i + 1 <= step;
            return (
              <div key={i} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                done ? "bg-primary text-primary-foreground" : "bg-secondary text-weak"
              }`}>
                <I className="w-4 h-4" />
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={submit} className="container max-w-3xl mt-8">
        <div className="lvb-card p-6 md:p-8 animate-fade-up" key={step}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Icon className="w-5 h-5" />
            </div>
            <h2 className="font-serif-lvb text-2xl md:text-3xl font-bold">{stepTitles[step - 1]}</h2>
          </div>
          {step === 1 && <p className="text-sm text-muted-foreground mb-6">Todas as respostas são sigilosas e protegidas</p>}

          <div className="space-y-6 mt-2">
            {step === 1 && (
              <>
                <Field label="Nome completo *">
                  <input type="text" value={data.nome} onChange={(e) => update("nome", e.target.value)}
                    className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-primary transition-colors" placeholder="Seu nome completo" />
                </Field>
                <Field label="E-mail *">
                  <input type="email" value={data.email} onChange={(e) => update("email", e.target.value)}
                    className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-primary" placeholder="voce@email.com" />
                </Field>
                <Field label="WhatsApp *">
                  <input type="tel" value={data.celular} onChange={(e) => update("celular", maskPhone(e.target.value))}
                    className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-primary" placeholder="(00) 00000-0000" />
                </Field>
              </>
            )}

            {step === 2 && (
              <>
                <Field label="Seu CPF está negativado? *">
                  <div className="space-y-2">
                    {["Sim, estou negativado(a)", "Não, meu nome está limpo", "Não sei ao certo"].map((o) => (
                      <Radio key={o} name="cpf" value={o} checked={data.situacao_cpf === o} onChange={() => update("situacao_cpf", o)} label={o} />
                    ))}
                  </div>
                </Field>
                <Field label="Qual sua renda mensal familiar? *">
                  <div className="space-y-2">
                    {["Até R$ 1.500", "R$ 1.500 a R$ 3.000", "R$ 3.000 a R$ 5.000", "R$ 5.000 a R$ 10.000", "Acima de R$ 10.000", "Não tenho renda fixa"].map((o) => (
                      <Radio key={o} name="renda" value={o} checked={data.renda_mensal === o} onChange={() => update("renda_mensal", o)} label={o} />
                    ))}
                  </div>
                </Field>
              </>
            )}

            {step === 3 && (
              <>
                <Field label="Valor total aproximado das suas dívidas? *">
                  <div className="space-y-2">
                    {["Até R$ 5.000", "R$ 5.000 a R$ 15.000", "R$ 15.000 a R$ 30.000", "R$ 30.000 a R$ 80.000", "Acima de R$ 80.000", "Não sei o valor exato"].map((o) => (
                      <Radio key={o} name="total" value={o} checked={data.total_dividas === o} onChange={() => update("total_dividas", o)} label={o} />
                    ))}
                  </div>
                </Field>
                <Field label="Quais tipos de dívida você tem? *">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {["Cartão de crédito", "Empréstimo pessoal", "Cheque especial", "Financiamento de veículo", "Financiamento imobiliário", "Crédito consignado", "Outro tipo de dívida"].map((o) => (
                      <Check key={o} checked={data.tipo_divida.includes(o)} onChange={() => toggle("tipo_divida", o)} label={o} />
                    ))}
                  </div>
                </Field>
                <Field label="Quais bancos você deve? *">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {["Nubank", "Itaú", "Bradesco", "Santander", "Banco do Brasil", "Caixa Econômica Federal", "Banco Pan", "Banco BMG", "BV Financeira", "Crefisa", "C6 Bank", "Inter", "Agibank", "Outros"].map((o) => (
                      <Check key={o} checked={data.bancos.includes(o)} onChange={() => toggle("bancos", o)} label={o} />
                    ))}
                  </div>
                </Field>
              </>
            )}

            {step === 4 && (
              <>
                <Field label="Há quanto tempo está com a dívida em atraso? *">
                  <div className="space-y-2">
                    {["Menos de 3 meses", "Entre 3 e 12 meses", "Entre 1 e 3 anos", "Mais de 3 anos", "Não estou em atraso, quero renegociar"].map((o) => (
                      <Radio key={o} name="tempo" value={o} checked={data.tempo_divida === o} onChange={() => update("tempo_divida", o)} label={o} />
                    ))}
                  </div>
                </Field>
                <Field label="Existe cobrança judicial ou notificação do banco? *">
                  <div className="space-y-2">
                    {["Sim, já recebi notificação", "Não, ainda não", "Não sei ao certo"].map((o) => (
                      <Radio key={o} name="cob" value={o} checked={data.cobranca_judicial === o} onChange={() => update("cobranca_judicial", o)} label={o} />
                    ))}
                  </div>
                </Field>
                <Field label="Já tentou renegociar diretamente com o banco? *">
                  <div className="space-y-2">
                    {["Não, nunca tentei", "Sim, mas não chegamos a um acordo", "Sim, mas o desconto foi insatisfatório", "Sim, tenho acordo ativo mas quero rever"].map((o) => (
                      <Radio key={o} name="neg" value={o} checked={data.ja_negociou === o} onChange={() => update("ja_negociou", o)} label={o} />
                    ))}
                  </div>
                </Field>
                <Field label="O que você mais quer resolver? *">
                  <div className="space-y-2">
                    {["Limpar meu nome no Serasa/SPC", "Reduzir o valor total da dívida", "Conseguir um parcelamento melhor", "Entender quais são os meus direitos", "Saber se a dívida já prescreveu", "Tudo isso"].map((o) => (
                      <Radio key={o} name="obj" value={o} checked={data.objetivo === o} onChange={() => update("objetivo", o)} label={o} />
                    ))}
                  </div>
                </Field>
              </>
            )}

            {step === 5 && (
              <>
                <Field label="Alguma dívida tem bem em garantia? *">
                  <div className="space-y-2">
                    {["Sim, tenho bem em garantia", "Não, são dívidas sem garantia", "Não sei ao certo"].map((o) => (
                      <Radio key={o} name="bem" value={o} checked={data.bem_garantia === o} onChange={() => update("bem_garantia", o)} label={o} />
                    ))}
                  </div>
                </Field>
                <Field label="Quanto da sua renda vai para pagar dívidas? *">
                  <div className="space-y-2">
                    {["Menos de 30%", "Entre 30% e 50%", "Entre 50% e 70%", "Mais de 70%", "Não consigo pagar nada, tudo em aberto"].map((o) => (
                      <Radio key={o} name="comp" value={o} checked={data.comprometimento_renda === o} onChange={() => update("comprometimento_renda", o)} label={o} />
                    ))}
                  </div>
                </Field>
                <Field label="Descreva brevemente sua situação (opcional)">
                  <textarea value={data.descricao_livre} onChange={(e) => update("descricao_livre", e.target.value)} rows={4}
                    className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none focus:border-primary resize-none" placeholder="Conte um pouco mais sobre sua situação..." />
                </Field>
                <div className="rounded-2xl border-2 border-gold/40 bg-gold/5 p-5">
                  <h3 className="font-bold flex items-center gap-2"><Shield className="w-4 h-4 text-gold" /> Autorização LGPD *</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Você autoriza o uso dos seus dados exclusivamente para geração da sua análise,
                    conforme a LGPD (Lei 13.709/2018)?
                  </p>
                  <div className="space-y-2 mt-4">
                    <Radio name="lgpd" value="sim" checked={data.lgpd === "sim"} onChange={() => update("lgpd", "sim")} label="Sim, autorizo o uso dos meus dados para a análise" />
                    <Radio name="lgpd" value="nao" checked={data.lgpd === "nao"} onChange={() => update("lgpd", "nao")} label="Não autorizo" />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3 justify-between">
          {step > 1 ? (
            <button type="button" onClick={prev}
              className="pill border border-border bg-card hover:bg-secondary px-6 py-3.5 font-semibold inline-flex items-center justify-center gap-2 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Anterior
            </button>
          ) : <span />}
          {step < 5 ? (
            <button type="button" onClick={next}
              className="pill bg-primary hover:bg-primary-hover text-primary-foreground px-7 py-3.5 font-semibold inline-flex items-center justify-center gap-2 transition-colors">
              Próximo <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button type="submit"
              className="pill bg-primary hover:bg-primary-hover text-primary-foreground px-7 py-3.5 font-semibold inline-flex items-center justify-center gap-2 transition-colors">
              Ver Minha Análise <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default Formulario;
