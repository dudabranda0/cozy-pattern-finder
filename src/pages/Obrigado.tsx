import { Link } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import { LvbLogo } from "@/components/LvbLogo";

const steps = [
  "Preencha o formulário com seus dados e situação",
  "Aguarde enquanto geramos sua análise",
  "Receba sua análise no e-mail cadastrado",
];

const Obrigado = () => (
  <div className="min-h-screen bg-background flex items-center justify-center p-5 py-12">
    <div className="lvb-card max-w-xl w-full p-8 md:p-10 text-center animate-fade-up">
      <div className="flex justify-center"><LvbLogo size="lg" /></div>
      <div className="mt-6 mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
        <Check className="w-8 h-8 text-emerald-600" strokeWidth={3} />
      </div>
      <h1 className="font-serif-lvb mt-5 text-3xl md:text-4xl font-bold leading-tight">
        Compra confirmada! Agora é só preencher.
      </h1>
      <p className="mt-3 text-muted-foreground">
        Sua análise está a um passo. Preencha o formulário e receba sua análise em menos de 5 minutos.
      </p>
      <ol className="mt-8 space-y-3 text-left">
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
        className="mt-8 pill bg-primary hover:bg-primary-hover text-primary-foreground px-7 py-4 font-semibold inline-flex items-center justify-center gap-2 transition-colors w-full"
      >
        Preencher meu formulário agora <ArrowRight className="w-5 h-5" />
      </Link>
    </div>
  </div>
);

export default Obrigado;
