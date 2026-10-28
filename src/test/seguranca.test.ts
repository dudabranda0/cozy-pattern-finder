import { describe, it, expect } from "vitest";
import { limparHtml } from "@/lib/seguranca";

describe("limparHtml", () => {
  it("mantém a formatação do diagnóstico", () => {
    const html = "<h2>Resumo</h2><p><strong>Risco:</strong> alto</p><table><tr><td>A</td></tr></table>";
    expect(limparHtml(html)).toContain("<h2>Resumo</h2>");
    expect(limparHtml(html)).toContain("<table>");
  });

  it("remove scripts e eventos", () => {
    const html = '<p onclick="alert(1)">Oi</p><script>alert(2)</script><img src=x onerror="alert(3)">';
    const limpo = limparHtml(html);
    expect(limpo).not.toContain("script");
    expect(limpo).not.toContain("onclick");
    expect(limpo).not.toContain("onerror");
  });
});
