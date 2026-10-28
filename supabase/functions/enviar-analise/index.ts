import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';

// Endereço do n8n fica só aqui no servidor, fora do código do site
const N8N_WEBHOOK = 'https://larissabrandao.app.n8n.cloud/webhook/analise-lvb';
const TAMANHO_MAXIMO = 100_000;

const BodySchema = z.object({
  codigo: z.string().min(4).max(32),
}).passthrough();

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
    return json({ status: 'metodo_invalido' }, 405);
  }

  try {
    const texto = await req.text();
    if (texto.length > TAMANHO_MAXIMO) {
      return json({ status: 'invalido' }, 413);
    }
    let corpo: unknown;
    try {
      corpo = JSON.parse(texto);
    } catch {
      return json({ status: 'invalido' }, 400);
    }
    const parsed = BodySchema.safeParse(corpo);
    if (!parsed.success) {
      return json({ status: 'invalido' }, 400);
    }

    const codigo = parsed.data.codigo.trim().toUpperCase();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Mesmo limite de tentativas do validar-credito: 10 a cada 15 minutos por IP
    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'desconhecido';
    const janela = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('tentativas_codigo')
      .select('id', { count: 'exact', head: true })
      .eq('ip', ip)
      .gte('criado_em', janela);
    if ((count ?? 0) >= 10) {
      return json({ status: 'muitas_tentativas' }, 429);
    }
    await supabase.from('tentativas_codigo').insert({ ip });

    // Consome o crédito de forma atômica antes de gerar a análise:
    // só atualiza se o código existe e ainda não foi usado
    const { data: consumido, error } = await supabase
      .from('creditos')
      .update({ usado: true, usado_em: new Date().toISOString() })
      .eq('codigo', codigo)
      .eq('usado', false)
      .select('codigo');

    if (error) {
      console.error('enviar-analise db error:', error.message);
      return json({ status: 'erro' }, 500);
    }
    if (!consumido || consumido.length === 0) {
      return json({ status: 'codigo_invalido' });
    }

    // Repassa ao n8n exatamente os mesmos dados que o formulário enviava
    let analiseId = '';
    let ok = false;
    try {
      const res = await fetch(N8N_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...parsed.data, codigo }),
        signal: AbortSignal.timeout(12000),
      });
      if (res.ok) {
        const j = await res.json();
        ok = j?.status === 'ok';
        analiseId = typeof j?.analise_id === 'string' ? j.analise_id : '';
      }
    } catch (e) {
      console.error('enviar-analise n8n error:', e);
    }

    if (!ok) {
      // O n8n não aceitou: devolve o crédito para a pessoa poder tentar de novo
      await supabase
        .from('creditos')
        .update({ usado: false, usado_em: null })
        .eq('codigo', codigo);
      return json({ status: 'erro' }, 502);
    }

    return json({ status: 'ok', analise_id: analiseId });
  } catch (e) {
    console.error('enviar-analise error:', e);
    return json({ status: 'erro' }, 500);
  }
});
