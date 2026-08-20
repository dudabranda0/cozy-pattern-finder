import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';

const BodySchema = z.object({
  email: z.string().email().max(255).optional(),
});

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Método não permitido' }, 405);
  }

  // Protegido por token compartilhado (somente o n8n conhece)
  const adminToken = Deno.env.get('CREDITO_ADMIN_TOKEN');
  const recebido = req.headers.get('x-admin-token');
  if (!adminToken || !recebido || recebido !== adminToken) {
    return json({ error: 'Não autorizado' }, 401);
  }

  try {
    let email: string | undefined;
    const raw = await req.text();
    if (raw) {
      const parsed = BodySchema.safeParse(JSON.parse(raw));
      if (!parsed.success) {
        return json({ error: 'Corpo inválido' }, 400);
      }
      email = parsed.data.email;
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Tenta inserir até 5 vezes em caso de colisão de código
    for (let tentativa = 0; tentativa < 5; tentativa++) {
      const codigo = gerarCodigo();
      const { error } = await supabase
        .from('creditos')
        .insert({ codigo, email: email ?? null });

      if (!error) {
        console.log(`Crédito criado: ${codigo}${email ? ` para ${email}` : ''}`);
        return json({ ok: true, codigo });
      }
      if (error.code !== '23505') {
        // 23505 = unique violation; qualquer outro erro é real
        console.error('criar-credito db error:', error.message);
        return json({ error: 'Erro ao criar crédito' }, 500);
      }
    }

    return json({ error: 'Não foi possível gerar código único' }, 500);
  } catch (e) {
    console.error('criar-credito error:', e);
    return json({ error: 'Erro interno' }, 500);
  }
});
