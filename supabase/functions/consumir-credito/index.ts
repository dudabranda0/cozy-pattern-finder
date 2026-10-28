import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';

const BodySchema = z.object({
  codigo: z.string().min(4).max(32),
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ ok: false, motivo: 'metodo_invalido' }, 405);
  }

  // Protegido por token compartilhado: só o n8n pode consumir um crédito
  const adminToken = Deno.env.get('CREDITO_ADMIN_TOKEN');
  const recebido = req.headers.get('x-admin-token');
  if (!adminToken || !recebido || recebido !== adminToken) {
    return json({ ok: false, motivo: 'nao_autorizado' }, 401);
  }

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return json({ ok: false, motivo: 'invalido' }, 400);
    }

    const codigo = parsed.data.codigo.trim().toUpperCase();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Marca como usado de forma atômica: só atualiza se ainda não foi usado
    const { data, error } = await supabase
      .from('creditos')
      .update({ usado: true, usado_em: new Date().toISOString() })
      .eq('codigo', codigo)
      .eq('usado', false)
      .select('codigo');

    if (error) {
      console.error('consumir-credito db error:', error.message);
      return json({ ok: false, motivo: 'erro' }, 500);
    }

    if (!data || data.length === 0) {
      // Não consumiu: ou não existe, ou já foi usado
      const { data: existente } = await supabase
        .from('creditos')
        .select('codigo')
        .eq('codigo', codigo)
        .maybeSingle();

      return json({ ok: false, motivo: existente ? 'usado' : 'nao_encontrado' });
    }

    return json({ ok: true });
  } catch (e) {
    console.error('consumir-credito error:', e);
    return json({ ok: false, motivo: 'erro' }, 500);
  }
});
