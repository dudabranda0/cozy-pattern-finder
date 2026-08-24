import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

// Caracteres sem ambiguidade visual (sem 0/O, 1/I/L)
const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

const gerarCodigo = (): string => {
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  const parte = Array.from(bytes, (b) => CHARSET[b % CHARSET.length]).join('');
  return `LVB-${parte}`;
};

// Extrai e-mail do payload do Kiwify tolerando variações de formato
const extrairEmail = (p: any): string | null => {
  const candidatos = [
    p?.customer?.email,
    p?.Customer?.email,
    p?.data?.customer?.email,
    p?.buyer?.email,
    p?.customer_email,
    p?.email,
  ];
  const email = candidatos.find((v) => typeof v === 'string' && /^\S+@\S+\.\S+$/.test(v));
  return email ? String(email).trim().toLowerCase() : null;
};

const extrairNome = (p: any): string | null => {
  const candidatos = [
    p?.customer?.full_name,
    p?.customer?.name,
    p?.Customer?.full_name,
    p?.data?.customer?.full_name,
    p?.buyer?.name,
  ];
  const nome = candidatos.find((v) => typeof v === 'string' && v.trim().length > 0);
  return nome ? String(nome).trim() : null;
};

// Só gera crédito para pagamento confirmado. Se o payload não traz status,
// assume pago (o Kiwify só dispara para os eventos assinados).
const foiPago = (p: any): boolean => {
  const status = String(
    p?.order_status ?? p?.status ?? p?.data?.order_status ?? '',
  ).toLowerCase();
  if (!status) return true;
  return ['paid', 'approved', 'completed', 'complete', 'pago', 'aprovado'].includes(status);
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Método não permitido' }, 405);
  }

  // Proteção: o token vai embutido na URL configurada no Kiwify (?token=...)
  const adminToken = Deno.env.get('CREDITO_ADMIN_TOKEN');
  const tokenUrl = new URL(req.url).searchParams.get('token');
  if (!adminToken || !tokenUrl || tokenUrl !== adminToken) {
    return json({ error: 'Não autorizado' }, 401);
  }

  try {
    const payload = await req.json().catch(() => null);
    if (!payload || typeof payload !== 'object') {
      return json({ error: 'Payload inválido' }, 400);
    }

    if (!foiPago(payload)) {
      console.log('kiwify-webhook: evento ignorado (não é pagamento confirmado)');
      return json({ ok: true, ignorado: true });
    }

    const email = extrairEmail(payload);
    const nome = extrairNome(payload);
    if (!email) {
      console.error('kiwify-webhook: e-mail não encontrado no payload');
      return json({ error: 'E-mail não encontrado no payload' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Deduplicação: o Kiwify pode reenviar o webhook. Se já existe um crédito
    // não usado para este e-mail criado nos últimos 30 min, reutiliza o mesmo.
    const trintaMinAtras = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: existente } = await supabase
      .from('creditos')
      .select('codigo')
      .eq('email', email)
      .eq('usado', false)
      .gte('criado_em', trintaMinAtras)
      .order('criado_em', { ascending: false })
      .limit(1)
      .maybeSingle();

    let codigo = existente?.codigo as string | undefined;

    if (!codigo) {
      for (let tentativa = 0; tentativa < 5; tentativa++) {
        const novo = gerarCodigo();
        const { error } = await supabase
          .from('creditos')
          .insert({ codigo: novo, email });
        if (!error) {
          codigo = novo;
          break;
        }
        if (error.code !== '23505') {
          console.error('kiwify-webhook db error:', error.message);
          return json({ error: 'Erro ao criar crédito' }, 500);
        }
      }
    }

    if (!codigo) {
      return json({ error: 'Não foi possível gerar código único' }, 500);
    }

    console.log(`Crédito ${codigo} gerado para ${email}`);

    // Envia o código por e-mail usando a infraestrutura de e-mails do app.
    // Se o domínio de e-mail ainda não estiver ativo, apenas registra no log
    // (o crédito já está garantido no banco).
    try {
      const { error: emailError } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'codigo-acesso',
          recipientEmail: email,
          idempotencyKey: `codigo-acesso-${codigo}`,
          templateData: { codigo, nome: nome ?? undefined },
        },
      });
      if (emailError) {
        console.error(`EMAIL_PENDING ${email} ${codigo}:`, emailError.message);
      }
    } catch (e) {
      console.error(`EMAIL_PENDING ${email} ${codigo}:`, e);
    }

    return json({ ok: true, codigo });
  } catch (e) {
    console.error('kiwify-webhook error:', e);
    return json({ error: 'Erro interno' }, 500);
  }
});
