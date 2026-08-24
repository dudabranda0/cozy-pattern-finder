# Plano: destravar a compra da Eduarda e blindar o fluxo de créditos

## Diagnóstico (verificado no banco agora)

- O reenvio do webhook **não gerou crédito**: a tabela só tem `LVB-D10B1` (o código manual, sem e-mail vinculado, não usado).
- Ou o workflow do n8n ainda não rodou (não está Active, ou a URL de produção não foi salva na Kiwify), ou o nó HTTP Request falhou ao chamar a criação do crédito.
- Eu não consigo ver os logs do seu n8n daqui — a verificação da execução precisa ser feita por você no painel do n8n.

## Passo 1 — Destravar a Eduarda agora (sem esperar webhook)

- Você me passa o e-mail usado na compra e eu vinculo esse e-mail ao código `LVB-D10B1`.
- Ela (ou você) entra em `/formulario`, digita `LVB-D10B1` e preenche a análise normalmente.
- Se preferir, gero um código novo com o e-mail dela e você encaminha.

## Passo 2 — Escolher UMA via definitiva para gerar crédito a cada venda

**Via A (recomendada): Kiwify direto no nosso backend, sem n8n**
- A função `kiwify-webhook` já está publicada e foi testada com sucesso: pagamento confirmado → crédito criado na hora com o e-mail da compra.
- Na Kiwify, troque a URL do webhook para:
  `https://rwzoqxtjcpoztglvvxjt.supabase.co/functions/v1/kiwify-webhook?token=<o token que você salvou>`
- Elimina os dois pontos de falha que ocorreram hoje (URL de teste vs produção e caminho dos campos no n8n), porque a função já procura o e-mail em vários formatos de payload.
- Seu workflow do n8n continua existindo para gerar a análise — só a criação de crédito sai dele.

**Via B: manter o n8n (como você ajustou)**
- No n8n, abra **Executions** e confira se o reenvio da Kiwify apareceu e onde parou.
- Confira no nó HTTP Request se existe o header `x-admin-token` com o token salvo (sem ele, a criação do crédito retorna 401).
- Confirme que o workflow está **Active** e que a Kiwify está com a URL de produção (sem `-test`).

## Passo 3 — Validar ponta a ponta

- Reenviar o webhook na Kiwify (log da venda → Reenviar).
- Eu confiro no banco se surgiu um crédito novo com o e-mail da compra.
- Testar o código na tela de "Digite seu código" do formulário.

## Observação sobre o e-mail do código

- O envio do e-mail com o código depende da configuração do domínio de e-mail (botão que te mostrei antes). Até lá, o crédito é gerado, mas o e-mail não sai automaticamente — o link "Pagou e não recebeu o código? Fale com a equipe" cobre esses casos.

## Detalhes técnicos

- Nenhuma mudança de código é necessária para a Via A — a função já existe e está ativa; a mudança é só a URL cadastrada na Kiwify.
- Na Via B, nenhuma mudança de código também — o ajuste é todo no n8n/Kiwify.
- Única escrita no banco: vincular o e-mail da compra ao código existente (Passo 1), ou gerar um código novo.
