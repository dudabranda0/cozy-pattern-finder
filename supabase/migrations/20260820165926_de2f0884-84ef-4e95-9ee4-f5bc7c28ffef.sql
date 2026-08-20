CREATE TABLE public.creditos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  email text,
  usado boolean NOT NULL DEFAULT false,
  usado_em timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.creditos TO service_role;

ALTER TABLE public.creditos ENABLE ROW LEVEL SECURITY;

CREATE INDEX creditos_codigo_idx ON public.creditos (codigo);