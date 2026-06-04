import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { LvbLogo } from "@/components/LvbLogo";
import { N8N_VALIDAR_TOKEN, WHATSAPP_LINK } from "@/lib/lvb-constants";

const Acesso = () => {
  const nav = useNavigate();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const code = token.trim();
    if (!code) {
      setError("Digite seu código de acesso.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(N8N_VALIDAR_TOKEN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: code }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.valido === true) {
        localStorage.setItem("lvb_token", code);
        nav("/formulario", { replace: true });
        return;
      }
      setError("Código inválido ou já utilizado. Verifique seu e-mail e tente novamente.");
    } catch {
      setError("Não foi possível validar seu código. Tente novamente em instantes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-5 py-12">
      <div className="lvb-card max-w-md w-full p-8 md:p-10 text-center animate-fade-up">
        <div className="flex justify-center"><LvbLogo size="lg" /></div>
        <h1 className="font-serif-lvb mt-6 text-3xl md:text-4xl font-bold leading-tight">
          Insira seu código de acesso
        </h1>
        <p className="mt-3 text-muted-foreground">
          Você recebeu seu código por e-mail após a compra
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4 text-left">
          <input
            type="text"
            value={token}
            onChange={(e) => { setToken(e.target.value); setError(""); }}
            placeholder="Digite seu código"
            autoComplete="off"
            className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-center tracking-wide outline-none focus:border-primary transition-colors"
          />

          {error && (
            <p className="text-sm font-medium text-destructive text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-cta pill bg-primary hover:bg-primary-hover text-primary-foreground px-7 py-4 font-semibold inline-flex items-center justify-center gap-2 w-full disabled:opacity-70"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Validando...</>
            ) : (
              <>Acessar minha análise <ArrowRight className="w-5 h-5" /></>
            )}
          </button>
        </form>

        <a
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block text-sm text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
        >
          Não recebeu seu código? Entre em contato
        </a>
      </div>
    </div>
  );
};

export default Acesso;
