import { SiteHeader, SiteFooter } from "@/components/SiteChrome";

const secoes: { t: string; c: React.ReactNode }[] = [
  { t: "Quem trata seus dados", c: "Larissa Vargas Brandão Sociedade Individual de Advocacia, CNPJ 63.806.543/0001-10, com endereço na Rodovia RSC-287, nº 366, Bairro Centro, Tabaí/RS, CEP 95863-000." },
  { t: "Que dados coletamos", c: "Nome completo, e-mail, telefone com WhatsApp, cidade e estado, faixa de idade, situação profissional, informações sobre renda e despesas, e informações sobre as dívidas que você nos informa no formulário." },
  { t: "Para que usamos", c: "Para elaborar a análise que você solicitou e entrar em contato a respeito dela. Se você autorizou o segundo item do formulário, também para enviar conteúdos e informações sobre direitos do consumidor bancário." },
  { t: "Com quem compartilhamos", c: "Seus dados não são vendidos nem compartilhados com terceiros para fins comerciais. Utilizamos ferramentas de tecnologia para processar e entregar a análise, que tratam os dados exclusivamente para essa finalidade e sob nossa orientação." },
  { t: "Por quanto tempo guardamos", c: "Mantemos seus dados pelo tempo necessário para o atendimento e para cumprimento de obrigações legais aplicáveis à advocacia." },
  { t: "Sigilo profissional", c: "As informações que você compartilha conosco são protegidas pelo sigilo profissional do advogado, previsto no Estatuto da Advocacia." },
  { t: "Seus direitos", c: "Você pode solicitar, a qualquer momento, acesso aos seus dados, correção de informações incorretas, exclusão dos dados, informação sobre com quem compartilhamos, e revogação do consentimento para recebimento de comunicações." },
  { t: "Como exercer seus direitos", c: <>Envie sua solicitação para <a href="mailto:larissabrandaoescritorio@gmail.com" className="text-primary underline underline-offset-4 break-all">larissabrandaoescritorio@gmail.com</a>. Responderemos dentro do prazo legal.</> },
  { t: "Cookies", c: "Este site utiliza cookies necessários ao seu funcionamento. Não utilizamos cookies de rastreamento publicitário." },
  { t: "Alterações", c: "Esta política pode ser atualizada. A data da última atualização aparece ao final." },
];

const PoliticaPrivacidade = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <SiteHeader />
    <main className="flex-1 container max-w-3xl py-12 md:py-16">
      <h1 className="font-serif-lvb text-4xl md:text-5xl text-primary mb-3">Política de Privacidade</h1>
      <div className="h-0.5 w-16 bg-gold rounded-full mb-10" />
      <article className="space-y-8 text-foreground/90 leading-relaxed">
        {secoes.map((s) => (
          <section key={s.t}>
            <h2 className="font-serif-lvb text-2xl text-primary mb-2">{s.t}</h2>
            <p>{s.c}</p>
          </section>
        ))}
        <p className="text-sm text-muted-foreground pt-4 border-t border-border">Última atualização: outubro de 2026</p>
      </article>
    </main>
    <SiteFooter />
  </div>
);

export default PoliticaPrivacidade;
