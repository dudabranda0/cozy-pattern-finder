import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, KeyRound } from "lucide-react";
import { LvbLogo } from "@/components/LvbLogo";
import { VALIDAR_TOKEN_WEBHOOK, CAKTO_LINK } from "@/lib/lvb-constants";
import { toast } from "@/hooks/use-toast";

// Formata a entrada no padrão LVB-XXXX-XXXX-XXXX (maiúsculas, alfanumérico)
const formatToken = (raw: string): string => {
  let v = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  // Remove o prefixo "LVB" se o usuário digitar, pois ele é fixo
  if (v.startsWith("LVB")) v = v.slice(3);
  const groups = v.slice(0, 12).match(/.{1,4}/g) || [];
  return ["LVB", ...groups].filter(Boolean).join("-");
};

const Acesso = () => {
  const nav = useNavigate();
  const [token, setToken] = useState("LVB-");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const isComplete = /^LVB-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(token);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErro("");
    if (!isComplete) {
      setErro("Digite o código completo no formato LVB-XXXX-XXXX-XXXX.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(VALIDAR_TOKEN_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const result = await res.json().catch(() => ({}));

      if (result?.valido === true) {
        sessionStorage.setItem("token_acesso", token);
        toast({ title: "Código validado!", description: "Você já pode preencher sua análise." });
        nav("/formulario", { replace: true });
        return;
      }

      if (result?.motivo === "ja_usado") {
        setErro("Este código já foi utilizado. Cada compra dá direito a uma análise.");
      } else {
        setErro("Código inválido. Confira se digitou exatamente como está no e-mail.");
      }
    } catch {
      setErro("Não foi possível validar agora. Tente novamente em instantes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 glass-header border-b border-border">
        <div className="container max-w-3xl flex items-center justify-between py-3">
          <Link to="/" aria-label="LVB Início">
            <LvbLogo size="md" />
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md lvb-card p-6 md:p-8 animate-fade-up">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5">
            <KeyRound className="w-5 h-5" />
          </div>
          <h1 className="font-serif-lvb text-2xl md:text-3xl font-bold">Insira seu código de acesso</h1>
          <p className="mt-2 text-muted-foreground text-sm md:text-base">
            Você recebeu este código por e-mail após a confirmação da compra.
          </p>

          <form onSubmit={submit} className="mt-7 space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-3 text-foreground">Código de acesso</label>
              <input
                type="text"
                inputMode="text"
                autoComplete="off"
                value={token}
                onChange={(e) => { setToken(formatToken(e.target.value)); setErro(""); }}
                placeholder="LVB-XXXX-XXXX-XXXX"
                className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-center tracking-wider font-mono text-lg uppercase outline-none focus:border-primary transition-colors"
              />
              {erro && <p className="mt-3 text-sm font-medium text-destructive">{erro}</p>}
              <p className="mt-3 text-xs text-muted-foreground">
                Após a compra, você recebe o código por e-mail em poucos minutos. Verifique também a caixa de spam.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-cta pill bg-primary hover:bg-primary-hover text-primary-foreground w-full px-6 py-4 font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Validando...
                </>
              ) : (
                "Validar código"
              )}
            </button>
          </form>

          <a
            href={CAKTO_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 block text-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Ainda não tem um código? Adquira sua análise aqui
          </a>
        </div>
      </main>
    </div>
  );
};

export default Acesso;
