import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KeyRound, Loader2, ArrowRight } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { VALIDAR_TOKEN_WEBHOOK } from "@/lib/lvb-constants";

// Formata para o padrão LVB-XXXX-XXXX-XXXX (maiúsculas e hífens automáticos)
const formatToken = (raw: string): string => {
  // Mantém apenas letras e números, em maiúsculas
  let v = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");

  // Se o usuário digitar/colar começando com "LVB", removemos para reanexar o prefixo
  if (v.startsWith("LVB")) v = v.slice(3);

  // Limita a 12 caracteres (4 + 4 + 4) após o prefixo
  v = v.slice(0, 12);

  const groups: string[] = [];
  for (let i = 0; i < v.length; i += 4) groups.push(v.slice(i, i + 4));

  return ["LVB", ...groups].filter(Boolean).join("-");
};

const Acesso = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState("LVB-");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isComplete = /^LVB-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(token);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToken(formatToken(e.target.value));
    if (error) setError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isComplete || loading) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch(VALIDAR_TOKEN_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json().catch(() => ({}));

      if (data?.valido === true) {
        sessionStorage.setItem("token_acesso", token);
        navigate("/formulario", { replace: true });
        return;
      }

      if (data?.motivo === "ja_usado") {
        setError("Este código já foi utilizado. Cada compra dá direito a uma análise.");
      } else {
        setError("Código inválido. Confira se digitou exatamente como está no e-mail.");
      }
    } catch {
      setError("Não foi possível validar agora. Tente novamente em instantes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <main className="flex-1 container max-w-xl py-16 md:py-24">
        <div className="lvb-card p-7 md:p-10 animate-fade-up">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <KeyRound className="w-7 h-7" />
          </div>

          <h1 className="font-serif-lvb mt-6 text-3xl md:text-4xl font-bold text-center leading-tight">
            Insira seu código de acesso
          </h1>
          <p className="mt-3 text-center text-muted-foreground">
            Você recebeu este código por e-mail após a confirmação da compra
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <input
                type="text"
                inputMode="text"
                autoComplete="off"
                spellCheck={false}
                value={token}
                onChange={handleChange}
                placeholder="LVB-XXXX-XXXX-XXXX"
                aria-label="Código de acesso"
                className="w-full rounded-2xl border-2 border-border bg-card px-4 py-4 text-center text-lg md:text-xl font-mono tracking-[0.15em] uppercase outline-none focus:border-primary transition-colors"
              />
              <p className="mt-2 text-xs text-muted-foreground text-center leading-relaxed">
                Após a compra, você recebe o código por e-mail em poucos minutos. Verifique também a caixa de spam.
              </p>
            </div>

            {error && (
              <p className="text-sm font-medium text-destructive text-center" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!isComplete || loading}
              className="btn-cta pill bg-primary hover:bg-primary-hover text-primary-foreground w-full px-6 py-4 font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Validando...
                </>
              ) : (
                <>
                  Validar código <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-7 pt-6 border-t border-border text-center">
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Ainda não tem um código? Adquira sua análise aqui
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Acesso;
