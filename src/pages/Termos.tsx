import { SiteHeader, SiteFooter } from "@/components/SiteChrome";

const Termos = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <SiteHeader />
    <main className="flex-1 container max-w-3xl py-12 md:py-16">
      <h1 className="font-serif-lvb text-4xl md:text-5xl text-primary mb-2">Termos de Uso</h1>
      <p className="text-sm text-muted-foreground mb-10">Última atualização: maio de 2026</p>

      <article className="prose-lvb space-y-8 text-foreground/90 leading-relaxed">
        <section>
          <h2 className="font-serif-lvb text-2xl text-primary mb-2">1. Sobre o serviço</h2>
          <p>O serviço "Análise de Dívida Bancária Personalizada" é oferecido pelo escritório LVB — Larissa De Vargas Brandão Advogados. Trata-se de uma análise jurídica inicial de caráter informativo, elaborada com base nas informações fornecidas pelo usuário.</p>
        </section>
        <section>
          <h2 className="font-serif-lvb text-2xl text-primary mb-2">2. Natureza do serviço</h2>
          <p>A análise fornecida é de caráter informativo e educativo. Não constitui consultoria jurídica formal, não estabelece relação advocatícia e não substitui o acompanhamento de um advogado para o seu caso.</p>
        </section>
        <section>
          <h2 className="font-serif-lvb text-2xl text-primary mb-2">3. Limitação de responsabilidade</h2>
          <p>O escritório LVB não se responsabiliza por decisões tomadas com base exclusivamente nesta análise. Os resultados podem variar de acordo com cada situação específica.</p>
        </section>
        <section>
          <h2 className="font-serif-lvb text-2xl text-primary mb-2">4. Pagamento</h2>
          <p>O valor de R$ 47,90 é cobrado por análise, em pagamento único. Não há cobrança recorrente. O acesso à análise é liberado imediatamente após a confirmação do pagamento.</p>
        </section>
        <section>
          <h2 className="font-serif-lvb text-2xl text-primary mb-2">5. Propriedade intelectual</h2>
          <p>Todo o conteúdo do site é de propriedade do escritório LVB e não pode ser reproduzido sem autorização prévia.</p>
        </section>
        <section>
          <h2 className="font-serif-lvb text-2xl text-primary mb-2">6. Contato</h2>
          <p>Dúvidas: <a href="mailto:analiselvb@gmail.com" className="text-primary underline underline-offset-4">analiselvb@gmail.com</a></p>
        </section>
      </article>
    </main>
    <SiteFooter />
  </div>
);

export default Termos;
