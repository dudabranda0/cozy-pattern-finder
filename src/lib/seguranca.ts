import DOMPurify from "dompurify";

// Limpa o HTML recebido do n8n antes de exibir na página de análise:
// remove scripts, eventos (onclick etc.) e marcações perigosas que possam
// vir no texto gerado pela IA a partir do relato livre do formulário.
export const limparHtml = (html: string): string =>
  DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["style", "form", "input", "iframe"],
  });
