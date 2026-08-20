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
    return json({ valido: false, motivo: 'metodo_invalido' }, 405);
  }

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return json({ valido: false, motivo: 'invalido' }, 400);
    }

    const codigo = parsed.data.codigo.trim().toUpperCase();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data, error } = await supabase
      .from('creditos')
      .select('codigo, usado')
      .eq('codigo', codigo)
      .maybeSingle();

    if (error) {
      console.error('validar-credito db error:', error.message);
      return json({ valido: false, motivo: 'erro' }, 500);
    }

    if (!data) {
      return json({ valido: false, motivo: 'nao_encontrado' });
    }
    if (data.usado) {
      return json({ valido: false, motivo: 'usado' });
    }

    return json({ valido: true });
  } catch (e) {
    console.error('validar-credito error:', e);
    return json({ valido: false, motivo: 'erro' }, 500);
  }
});
