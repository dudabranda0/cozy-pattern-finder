-- Registro de tentativas de validação de código, usado para limitar
-- quantas vezes um mesmo IP pode testar códigos em um intervalo de tempo.
CREATE TABLE public.tentativas_codigo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.tentativas_codigo TO service_role;

ALTER TABLE public.tentativas_codigo ENABLE ROW LEVEL SECURITY;

CREATE INDEX tentativas_codigo_ip_criado_idx ON public.tentativas_codigo (ip, criado_em);
