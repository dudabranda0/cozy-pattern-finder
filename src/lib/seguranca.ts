import DOMPurify from "dompurify";

// Limpa o HTML recebido do n8n antes de exibir na página de análise:
// remove scripts, eventos (onclick etc.) e marcações perigosas que possam
// vir no texto gerado pela IA a partir do relato livre do formulário.
// Estilos e links que abrem em nova aba são mantidos, para a análise
// continuar com a mesma aparência que o n8n monta.
export const limparHtml = (html: string): string =>
  DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_TAGS: ["style"],
    FORCE_BODY: true,
    ADD_ATTR: ["target"],
    FORBID_TAGS: ["form", "input", "iframe"],
  });
