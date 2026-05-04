import { SiteHeader, SiteFooter } from "@/components/SiteChrome";

const Privacidade = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <SiteHeader />
    <main className="flex-1 container max-w-3xl py-12 md:py-16">
      <h1 className="font-serif-lvb text-4xl md:text-5xl text-primary mb-2">Política de Privacidade</h1>
      <p className="text-sm text-muted-foreground mb-10">Última atualização: maio de 2026</p>

      <article className="space-y-8 text-foreground/90 leading-relaxed">
        <section>
          <h2 className="font-serif-lvb text-2xl text-primary mb-2">1. Dados coletados</h2>
          <p>Coletamos: nome completo, e-mail, WhatsApp e informações sobre a situação de endividamento fornecidas voluntariamente no formulário.</p>
        </section>
        <section>
          <h2 className="font-serif-lvb text-2xl text-primary mb-2">2. Finalidade</h2>
          <p>Os dados são usados exclusivamente para:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Gerar a análise personalizada solicitada</li>
            <li>Enviar a análise por e-mail</li>
            <li>Contato relacionado ao serviço contratado</li>
          </ul>
        </section>
        <section>
          <h2 className="font-serif-lvb text-2xl text-primary mb-2">3. Base legal (LGPD)</h2>
          <p>O tratamento dos dados é baseado no consentimento expresso do titular (Art. 7º, I da Lei 13.709/2018) e na execução do serviço contratado (Art. 7º, V).</p>
        </section>
        <section>
          <h2 className="font-serif-lvb text-2xl text-primary mb-2">4. Compartilhamento</h2>
          <p>Seus dados não são vendidos, cedidos ou compartilhados com terceiros. São utilizados apenas internamente para a prestação do serviço.</p>
        </section>
        <section>
          <h2 className="font-serif-lvb text-2xl text-primary mb-2">5. Armazenamento</h2>
          <p>Os dados são armazenados em ambiente seguro e criptografado. O prazo de retenção é de 5 anos, conforme legislação aplicável.</p>
        </section>
        <section>
          <h2 className="font-serif-lvb text-2xl text-primary mb-2">6. Direitos do titular</h2>
          <p>Você tem direito a:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Acessar seus dados</li>
            <li>Corrigir dados incorretos</li>
            <li>Solicitar a exclusão dos dados</li>
            <li>Revogar o consentimento a qualquer momento</li>
          </ul>
          <p className="mt-2">Para exercer seus direitos: <a href="mailto:larissabrandaolah23@gmail.com" className="text-primary underline underline-offset-4">larissabrandaolah23@gmail.com</a></p>
        </section>
        <section>
          <h2 className="font-serif-lvb text-2xl text-primary mb-2">7. Cookies</h2>
          <p>O site utiliza cookies estritamente necessários para funcionamento técnico. Não utilizamos cookies de rastreamento ou publicidade.</p>
        </section>
        <section>
          <h2 className="font-serif-lvb text-2xl text-primary mb-2">8. Contato do encarregado (DPO)</h2>
          <p>Larissa De Vargas Brandão<br /><a href="mailto:larissabrandaolah23@gmail.com" className="text-primary underline underline-offset-4">larissabrandaolah23@gmail.com</a></p>
        </section>
      </article>
    </main>
    <SiteFooter />
  </div>
);

export default Privacidade;
