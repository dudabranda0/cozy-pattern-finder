import { Link } from "react-router-dom";
import { Check, ArrowRight, Mail } from "lucide-react";
import { LvbLogo } from "@/components/LvbLogo";
import { WHATSAPP_SUPORTE } from "@/lib/lvb-constants";

const steps = [
  "Abra o e-mail que enviamos com seu código de acesso (confira também a caixa de spam)",
  "Clique no link do e-mail para abrir o formulário",
  "Digite o código e preencha o formulário — leva menos de 5 minutos",
  "Receba sua análise na tela e no seu e-mail em poucos minutos",
];

const Obrigado = () => {
  return (
  <div className="min-h-screen bg-background flex items-center justify-center p-5 py-12">
    <div className="lvb-card max-w-xl w-full p-8 md:p-10 text-center animate-fade-up">
      <div className="flex justify-center"><LvbLogo size="lg" /></div>
      <div className="mt-6 mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
        <Check className="w-8 h-8 text-emerald-600" strokeWidth={3} />
      </div>
      <h1 className="font-serif-lvb mt-5 text-3xl md:text-4xl font-bold leading-tight">
        Pagamento confirmado!
      </h1>
      <p className="mt-3 text-muted-foreground">
        Enviamos um <strong className="text-foreground">código de acesso</strong> para o e-mail da sua compra.
        Sua análise <strong className="text-foreground">só é gerada depois</strong> que você preencher o formulário.
      </p>
      <div className="mt-5 bg-beige-deep rounded-2xl p-4 flex gap-3 items-start text-left">
        <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <p className="text-sm text-foreground/85 leading-relaxed">
          Seu código é o seu crédito: <strong className="text-foreground">ele não expira</strong>.
          Se esta página fechar, volte quando quiser e use o mesmo código para preencher o formulário.
        </p>
      </div>
      <ol className="mt-6 space-y-3 text-left">
        {steps.map((s, i) => (
          <li key={s} className="bg-beige-deep rounded-2xl p-4 flex gap-4 items-start">
            <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            <span className="pt-1 text-foreground/90">{s}</span>
          </li>
        ))}
      </ol>
      <Link
        to="/formulario"
        className="btn-cta mt-8 pill bg-primary hover:bg-primary-hover text-primary-foreground px-7 py-4 font-semibold inline-flex items-center justify-center gap-2 w-full"
      >
        Já tenho meu código — preencher formulário <ArrowRight className="w-5 h-5" />
      </Link>
      <p className="mt-4 text-xs text-muted-foreground">
        Pagou e não recebeu o código?{" "}
        <a
          href={WHATSAPP_SUPORTE}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary font-semibold underline underline-offset-2"
        >
          Fale com a equipe
        </a>
      </p>
    </div>
  </div>
  );
};

export default Obrigado;
