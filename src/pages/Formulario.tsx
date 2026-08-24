import { useState, useEffect, FormEvent, useMemo, useRef } from "react";
import {
  ArrowLeft, ArrowRight, User, Banknote, Home, CreditCard,
  Shield, BellRing, Target, Loader2, KeyRound, ChevronDown, Search,
  Check, AlertTriangle, Instagram,
} from "lucide-react";
import { LvbLogo } from "@/components/LvbLogo";
import { N8N_WEBHOOK, CAKTO_LINK, COURSE_LINK, WHATSAPP_SUPORTE, INSTAGRAM_LINK } from "@/lib/lvb-constants";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

/* ================= TIPOS ================= */

type Divida = {
  modalidade: string;
  instituicao: string;
  instituicao_grupo: string;
  valor: string;
  atraso: string;
  formalizacao: string;
  garantia: string;
  coassinante: string;
  finalidade: string;
  associado_cooperativa: string;
};

type FormData = {
  identificacao: {
    nome_completo: string; email: string; whatsapp: string;
    cidade: string; estado: string; faixa_idade: string; situacao_profissional: string;
  };
  renda: {
    renda_liquida: string; tipo_renda: string; outra_renda_casa: string;
    dependentes: string; valor_total_dividas: string; comprometimento_renda: string;
    pagamento_minimos: string; cpf_negativado: string;
  };
  despesas: {
    tipo_moradia: string; gasto_moradia: string; gasto_alimentacao: string;
    gasto_saude: string; gasto_educacao: string; gasto_transporte: string;
    situacao_familiar: string[]; sobra_mensal: string;
  };
  tipos_divida: string[];
  dividas: Divida[];
  patrimonio: {
    bens: string[]; socio_empresa: string; avalista_terceiro: string;
    salario_banco_credor: string; desconto_automatico: string;
    qtd_consignados: string; transferencia_bens: string;
  };
  cobranca: {
    comunicacoes_recebidas: string[]; citado_processo: string; medidas_sofridas: string[];
    tentativa_negociacao: string; forma_cobranca: string[]; limpa_nome: string; acao_anterior: string;
  };
  objetivo: {
    urgencia: string[]; prazo: string; capacidade_mensal: string;
    valor_a_vista: string; relato_livre: string; aceite_lgpd: boolean;
  };
};

const emptyDivida = (modalidade: string): Divida => ({
  modalidade, instituicao: "", instituicao_grupo: "", valor: "", atraso: "",
  formalizacao: "", garantia: "", coassinante: "", finalidade: "", associado_cooperativa: "",
});

const emptyData: FormData = {
  identificacao: { nome_completo: "", email: "", whatsapp: "", cidade: "", estado: "", faixa_idade: "", situacao_profissional: "" },
  renda: { renda_liquida: "", tipo_renda: "", outra_renda_casa: "", dependentes: "", valor_total_dividas: "", comprometimento_renda: "", pagamento_minimos: "", cpf_negativado: "" },
  despesas: { tipo_moradia: "", gasto_moradia: "", gasto_alimentacao: "", gasto_saude: "", gasto_educacao: "", gasto_transporte: "", situacao_familiar: [], sobra_mensal: "" },
  tipos_divida: [],
  dividas: [],
  patrimonio: { bens: [], socio_empresa: "", avalista_terceiro: "", salario_banco_credor: "", desconto_automatico: "", qtd_consignados: "", transferencia_bens: "" },
  cobranca: { comunicacoes_recebidas: [], citado_processo: "", medidas_sofridas: [], tentativa_negociacao: "", forma_cobranca: [], limpa_nome: "", acao_anterior: "" },
  objetivo: { urgencia: [], prazo: "", capacidade_mensal: "", valor_a_vista: "", relato_livre: "", aceite_lgpd: false },
};

/* ================= OPÇÕES (valores exatos do motor) ================= */

type Opt = { v: string; l: string };
const o = (v: string, l: string): Opt => ({ v, l });

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

const FAIXA_IDADE: Opt[] = [
  o("ate_29", "Até 29 anos"), o("30_39", "De 30 a 39 anos"), o("40_49", "De 40 a 49 anos"),
  o("50_59", "De 50 a 59 anos"), o("60_mais", "60 anos ou mais"),
];

const SITUACAO_PROFISSIONAL: Opt[] = [
  o("clt", "CLT com carteira assinada"), o("servidor", "Servidor público ou militar"),
  o("aposentado", "Aposentado ou pensionista do INSS"), o("autonomo", "Autônomo ou MEI"),
  o("empresario", "Empresário com CNPJ ativo"), o("desempregado", "Desempregado no momento"),
  o("sem_renda", "Sem renda própria"),
];

const RENDA_LIQUIDA: Opt[] = [
  o("ate_1500", "Até R$ 1.500"), o("1501_3000", "De R$ 1.501 a R$ 3.000"),
  o("3001_5000", "De R$ 3.001 a R$ 5.000"), o("5001_10000", "De R$ 5.001 a R$ 10.000"),
  o("10001_20000", "De R$ 10.001 a R$ 20.000"), o("acima_20000", "Acima de R$ 20.000"),
];

const TIPO_RENDA: Opt[] = [
  o("fixa", "Fixa todo mês"), o("variavel", "Variável"),
  o("sem_renda_fixa", "Estou sem renda fixa no momento"),
];

const OUTRA_RENDA: Opt[] = [
  o("nao", "Não, sou a única fonte"), o("menor", "Sim, uma renda menor que ajuda"),
  o("equivalente", "Sim, renda parecida ou maior que a minha"),
];

const DEPENDENTES: Opt[] = [
  o("nenhuma", "Nenhuma"), o("uma", "1 pessoa"), o("duas_tres", "De 2 a 3 pessoas"), o("quatro_mais", "4 ou mais"),
];

const VALOR_TOTAL_DIVIDAS: Opt[] = [
  o("ate_10k", "Até R$ 10.000"), o("10k_30k", "De R$ 10.001 a R$ 30.000"),
  o("30k_60k", "De R$ 30.001 a R$ 60.000"), o("60k_100k", "De R$ 60.001 a R$ 100.000"),
  o("100k_300k", "De R$ 100.001 a R$ 300.000"), o("300k_500k", "De R$ 300.001 a R$ 500.000"),
  o("acima_500k", "Acima de R$ 500.000"), o("nao_sei", "Perdi o controle, não sei dizer"),
];

const COMPROMETIMENTO: Opt[] = [
  o("ate_30", "Até 30%"), o("31_50", "De 31% a 50%"), o("51_70", "De 51% a 70%"),
  o("mais_70", "Mais de 70%"), o("tudo_e_falta", "Vai tudo e ainda falta"), o("nao_calculo", "Não consigo calcular"),
];

const PAGAMENTO_MINIMOS: Opt[] = [
  o("em_dia_apertado", "Estou em dia, mas apertado"), o("so_minimo", "Pago só o mínimo do cartão"),
  o("algumas_sim", "Pago algumas e atraso outras"), o("nada", "Não estou conseguindo pagar nada"),
];

const CPF_NEGATIVADO: Opt[] = [
  o("sim_serasa", "Sim, Serasa ou SPC"), o("sim_protesto", "Sim, e também tenho protesto em cartório"),
  o("nao", "Não"), o("nao_sei", "Não sei"),
];

const TIPO_MORADIA: Opt[] = [
  o("propria_quitada", "Própria e quitada"), o("propria_financiada", "Própria e financiada"),
  o("aluguel", "Aluguel"), o("familiares", "Moro com familiares, sem custo"), o("cedida", "Cedida"),
];

const GASTO_MORADIA: Opt[] = [
  o("ate_800", "Até R$ 800"), o("801_1500", "De R$ 801 a R$ 1.500"), o("1501_3000", "De R$ 1.501 a R$ 3.000"),
  o("3001_6000", "De R$ 3.001 a R$ 6.000"), o("6001_12000", "De R$ 6.001 a R$ 12.000"), o("acima_12000", "Acima de R$ 12.000"),
];

const GASTO_ALIMENTACAO: Opt[] = [
  o("ate_600", "Até R$ 600"), o("601_1200", "De R$ 601 a R$ 1.200"), o("1201_2500", "De R$ 1.201 a R$ 2.500"),
  o("2501_5000", "De R$ 2.501 a R$ 5.000"), o("acima_5000", "Acima de R$ 5.000"),
];

const GASTO_SAUDE: Opt[] = [
  o("nenhum", "Nenhum"), o("ate_300", "Até R$ 300"), o("301_800", "De R$ 301 a R$ 800"),
  o("801_2000", "De R$ 801 a R$ 2.000"), o("acima_2000", "Acima de R$ 2.000"),
];

const GASTO_EDUCACAO: Opt[] = [
  o("nenhum", "Nenhum"), o("ate_500", "Até R$ 500"), o("501_1500", "De R$ 501 a R$ 1.500"),
  o("1501_3000", "De R$ 1.501 a R$ 3.000"), o("acima_3000", "Acima de R$ 3.000"),
];

const GASTO_TRANSPORTE: Opt[] = [
  o("ate_300", "Até R$ 300"), o("301_800", "De R$ 301 a R$ 800"),
  o("801_1500", "De R$ 801 a R$ 1.500"), o("acima_1500", "Acima de R$ 1.500"),
];

const SITUACAO_FAMILIAR: Opt[] = [
  o("idoso", "Pessoa idosa sob meus cuidados"), o("deficiencia", "Pessoa com deficiência sob meus cuidados"),
  o("doenca_cronica", "Doença crônica ou tratamento continuado"), o("crianca_pequena", "Criança de até 6 anos"),
  o("nenhuma", "Nenhuma dessas"),
];

const SOBRA_MENSAL: Opt[] = [
  o("folga", "Sobra uma folga boa"), o("pouco", "Sobra pouco, mas fecha"), o("zero", "Fica no zero"),
  o("falta_cubro", "Falta todo mês e eu cubro com cartão ou empréstimo novo"),
  o("falta_sem_cobrir", "Falta e eu não tenho como cobrir"),
];

const TIPOS_DIVIDA: Opt[] = [
  o("cartao_credito", "Cartão de crédito com fatura atrasada"),
  o("cheque_especial", "Cheque especial ou limite da conta"),
  o("emprestimo_pessoal", "Empréstimo pessoal"),
  o("consignado", "Empréstimo consignado (desconto em folha ou benefício)"),
  o("cartao_consignado", "Cartão consignado ou cartão benefício"),
  o("acordo_renegociacao", "Acordo ou renegociação que eu assinei com o banco"),
  o("financiamento_veiculo", "Financiamento de veículo"),
  o("financiamento_imovel", "Financiamento de imóvel"),
  o("consorcio", "Consórcio"),
  o("capital_giro", "Capital de giro ou empréstimo da empresa"),
  o("cheque_especial_pj", "Cheque especial PJ ou conta garantida"),
  o("antecipacao_recebiveis", "Antecipação de recebíveis ou desconto de duplicatas"),
  o("crediario", "Cartão de loja ou crediário"),
  o("fintech", "Empréstimo em aplicativo ou fintech"),
  o("apostas", "Dívida ligada a apostas ou jogos online"),
  o("empresa_cobranca", "Cobrança de empresa de cobrança ou dívida vendida"),
  o("avalista", "Dívida em que eu sou só avalista ou fiador"),
];

const modalidadeLabel = (v: string) => TIPOS_DIVIDA.find((t) => t.v === v)?.l ?? v;

const INSTITUICOES: { grupo: string; grupoLabel: string; itens: string[] }[] = [
  { grupo: "cooperativa", grupoLabel: "Cooperativas de crédito", itens: ["Sicoob", "Sicredi", "Cresol", "Unicred", "Ailos", "Viacredi", "Uniprime", "Outra cooperativa"] },
  { grupo: "banco_varejo", grupoLabel: "Bancos", itens: ["Itaú", "Bradesco", "Santander", "Banco do Brasil", "Caixa", "Banrisul", "Safra"] },
  { grupo: "digital_fintech", grupoLabel: "Bancos digitais e fintechs", itens: ["Nubank", "Inter", "C6", "Neon", "Will", "PicPay", "Mercado Pago", "Outro aplicativo"] },
  { grupo: "financeira", grupoLabel: "Financeiras", itens: ["BV", "Pan", "Crefisa", "Agibank", "Daycoval", "Omni", "Aymoré", "Losango", "Porto Bank"] },
  { grupo: "varejo_crediario", grupoLabel: "Lojas e crediário", itens: ["Financeira de loja", "Cartão de loja"] },
  { grupo: "cobranca_cessionaria", grupoLabel: "Empresas de cobrança", itens: ["Empresa de cobrança", "Fundo que comprou a dívida", "Não sei quem cobra"] },
];

const VALOR_DIVIDA: Opt[] = [
  o("ate_5k", "Até R$ 5.000"), o("5k_10k", "De R$ 5.001 a R$ 10.000"),
  o("10k_20k", "De R$ 10.001 a R$ 20.000"), o("20k_30k", "De R$ 20.001 a R$ 30.000"),
  o("30k_60k", "De R$ 30.001 a R$ 60.000"), o("60k_150k", "De R$ 60.001 a R$ 150.000"),
  o("acima_150k", "Acima de R$ 150.000"), o("nao_sei", "Não sei"),
];

const ATRASO: Opt[] = [
  o("em_dia", "Está em dia"), o("ate_30d", "Até 30 dias"), o("31_90d", "De 31 a 90 dias"),
  o("91_180d", "De 91 a 180 dias"), o("6m_1a", "De 6 meses a 1 ano"),
  o("1a_3a", "De 1 a 3 anos"), o("3a_5a", "De 3 a 5 anos"), o("mais_5a", "Mais de 5 anos"),
];

const FORMALIZACAO: Opt[] = [
  o("contrato_assinado", "Assinei contrato ou cédula no banco"),
  o("so_aplicativo", "Contratei pelo aplicativo, sem assinar papel"),
  o("acordo_pos_atraso", "Assinei um acordo depois que atrasei"),
  o("nao_lembro", "Não lembro"),
];

const GARANTIA: Opt[] = [
  o("veiculo", "Sim, veículo"), o("imovel", "Sim, imóvel"), o("aplicacao", "Sim, aplicação financeira"),
  o("recebiveis", "Sim, recebíveis da empresa"), o("sem_garantia", "Não tem garantia"), o("nao_sei", "Não sei"),
];

const COASSINANTE: Opt[] = [
  o("conjuge", "Sim, meu cônjuge"), o("familiar", "Sim, um familiar"), o("socio", "Sim, meu sócio"),
  o("sozinho", "Assinei sozinho"), o("nao_sei", "Não sei"),
];

const FINALIDADE: Opt[] = [
  o("dia_a_dia", "Necessidade do dia a dia"), o("saude", "Emergência de saúde"),
  o("pagar_divida", "Pagar outra dívida"), o("empresa", "Investir na empresa"),
  o("compra_planejada", "Compra planejada"), o("nao_informar", "Prefiro não informar"),
];

const ASSOCIADO_COOP: Opt[] = [o("sim", "Sim"), o("nao", "Não"), o("nao_sei", "Não sei")];

const BENS: Opt[] = [
  o("imovel_moradia", "Imóvel próprio onde eu moro"), o("outro_imovel", "Outro imóvel além do de moradia"),
  o("veiculo_quitado", "Veículo quitado"), o("veiculo_financiado", "Veículo financiado"),
  o("investimentos", "Investimento, poupança ou aplicação"),
  o("bens_empresa", "Máquina, equipamento ou estoque de empresa"),
  o("nenhum", "Nenhum bem no meu nome"),
];

const SOCIO_EMPRESA: Opt[] = [
  o("sim_avalista", "Sim, e assinei como avalista das dívidas dela"),
  o("sim_nao_assinei", "Sim, mas não assinei nada pessoalmente"),
  o("sim_nao_sei", "Sim, e não sei se assinei como avalista"),
  o("nao", "Não"),
];

const AVALISTA_TERCEIRO: Opt[] = [
  o("familiar", "Sim, de um familiar"), o("socio_empresa", "Sim, de sócio ou empresa"),
  o("aluguel", "Sim, contrato de aluguel"), o("nao", "Não"),
];

const SALARIO_BANCO: Opt[] = [
  o("sim", "Sim"), o("nao", "Não"),
  o("sim_retendo", "Sim, e o banco está segurando valores quando o salário cai"),
];

const DESCONTO_AUTOMATICO: Opt[] = [
  o("debito_automatico", "Débito automático na conta"), o("folha_beneficio", "Desconto em folha ou no benefício"),
  o("ambos", "Os dois"), o("nao", "Não"),
];

const QTD_CONSIGNADOS: Opt[] = [
  o("nenhum", "Nenhum"), o("1_2", "1 ou 2"), o("3_5", "De 3 a 5"),
  o("mais_5", "Mais de 5"), o("nao_sei", "Não sei quantos"),
];

const TRANSFERENCIA_BENS: Opt[] = [
  o("nao", "Não"), o("veiculo", "Sim, um veículo"), o("imovel", "Sim, um imóvel"),
  o("cotas", "Sim, cotas de empresa"), o("nao_informar", "Prefiro não informar"),
];

const COMUNICACOES: Opt[] = [
  o("carta_notificacao", "Carta registrada de notificação do banco"),
  o("intimacao_cartorio", "Intimação de cartório de protesto"),
  o("carta_consolidacao", "Carta falando em consolidação da propriedade do imóvel"),
  o("oficial_justica", "Visita de oficial de justiça"),
  o("carta_forum", "Carta ou telegrama do fórum"),
  o("so_mensagens", "Só mensagem, e-mail e ligação"),
  o("nenhuma", "Nenhuma"),
];

const CITADO_PROCESSO: Opt[] = [
  o("nao", "Não"), o("execucao", "Sim, uma execução"),
  o("busca_apreensao", "Sim, busca e apreensão de veículo"),
  o("cobranca_monitoria", "Sim, ação de cobrança ou monitória"),
  o("nao_sei_tipo", "Sim, mas não sei qual tipo"),
  o("descobri_sem_citacao", "Descobri que tenho processo, mas nunca fui citado"),
];

const MEDIDAS: Opt[] = [
  o("bloqueio", "Bloqueio de dinheiro na conta"), o("penhora", "Penhora de bem"),
  o("restricao_veiculo", "Restrição para transferir o veículo"),
  o("desconto_judicial", "Desconto judicial no salário"), o("nenhuma", "Nenhuma"),
];

const TENTATIVA_NEGOCIACAO: Opt[] = [
  o("valor_nao_cabe", "Sim, mas o valor não cabe no meu bolso"),
  o("acordo_quebrado", "Sim, fechei acordo e não consegui pagar"),
  o("banco_recusou", "Sim, e o banco recusou"),
  o("desconto_pequeno", "Sim, e o desconto foi muito pequeno"),
  o("nunca_tentei", "Não, nunca tentei"),
  o("nao_consegui_falar", "Tentei e não consegui falar com quem resolve"),
];

const FORMA_COBRANCA: Opt[] = [
  o("ligacao_diaria", "Ligação todo dia, sem parar"),
  o("terceiros", "Ligam para familiares, vizinhos ou referências"),
  o("trabalho", "Ligam para o meu trabalho"),
  o("ameaca", "Recebi ameaça ou passei constrangimento"),
  o("so_mensagem", "Só mensagem e e-mail"),
  o("nao_cobrado", "Não estou sendo cobrado"),
];

const LIMPA_NOME: Opt[] = [
  o("sim_nao_resolveu", "Sim, e não resolveu"), o("sim_piorou", "Sim, e piorou"), o("nao", "Não"),
];

const ACAO_ANTERIOR: Opt[] = [
  o("nao", "Não"), o("em_andamento", "Sim, e ainda está correndo"),
  o("perdi", "Sim, e perdi"),
  o("perdi_com_custas", "Sim, perdi e ainda tive que pagar custas ou honorários da outra parte"),
  o("nao_sei", "Não sei o resultado"),
];

const URGENCIA: Opt[] = [
  o("nao_perder_carro", "Não perder meu carro"), o("nao_perder_imovel", "Não perder meu imóvel"),
  o("parar_cobranca", "Parar as cobranças e as ligações"),
  o("desbloquear_conta", "Desbloquear minha conta ou parar penhora"),
  o("reduzir_divida", "Diminuir o valor total da dívida"), o("limpar_nome", "Limpar meu nome"),
  o("reduzir_desconto", "Diminuir o desconto no meu salário ou benefício"),
  o("sair_processo", "Sair do processo que eu já tenho"),
  o("organizar", "Organizar tudo e voltar a respirar"),
];

const PRAZO: Opt[] = [
  o("imediato", "Imediato, está crítico"), o("30_dias", "Nos próximos 30 dias"),
  o("90_dias", "Nos próximos 90 dias"), o("informando", "Só estou me informando"),
];

const CAPACIDADE_MENSAL: Opt[] = [
  o("nada", "Nada no momento"), o("ate_10", "Até 10% da minha renda"),
  o("10_20", "De 10% a 20%"), o("20_30", "De 20% a 30%"), o("nao_informar", "Prefiro não informar"),
];

const VALOR_A_VISTA: Opt[] = [
  o("sim_tenho", "Sim, tenho"), o("sim_familiar", "Sim, com ajuda de familiar"),
  o("alguns_meses", "Teria daqui a alguns meses"), o("nao", "Não"),
];

/* ================= HELPERS ================= */

const RELATO_MAX = 2000;
const DRAFT_KEY = "lvb_form_draft_v2";

const sanitizeText = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/ {2,}/g, " ")
    .trim();
};

const sanitizePayload = <T extends Record<string, any>>(data: T): T => {
  const result: any = Array.isArray(data) ? [] : {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string") result[key] = sanitizeText(value);
    else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === "string" ? sanitizeText(item)
        : item && typeof item === "object" ? sanitizePayload(item as any) : item);
    } else if (value && typeof value === "object") result[key] = sanitizePayload(value as any);
    else result[key] = value;
  }
  return result as T;
};

const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

/** Toggle em múltipla escolha com opção exclusiva (ex: "nenhuma" desmarca as demais) */
const toggleMulti = (list: string[], value: string, exclusive?: string): string[] => {
  if (exclusive && value === exclusive) return list.includes(value) ? [] : [value];
  const sem = exclusive ? list.filter((x) => x !== exclusive) : list;
  return sem.includes(value) ? sem.filter((x) => x !== value) : [...sem, value];
};

const ATRASO_ORDEM = ["em_dia", "ate_30d", "31_90d", "91_180d", "6m_1a", "1a_3a", "3a_5a", "mais_5a"];
const ATRASO_LABEL: Record<string, string> = Object.fromEntries(ATRASO.map((x) => [x.v, x.l]));

const piorAtraso = (dividas: Divida[]): string => {
  let max = -1;
  for (const d of dividas) {
    const i = ATRASO_ORDEM.indexOf(d.atraso);
    if (i > max) max = i;
  }
  if (max <= 0) return ""; // em_dia ou vazio: sem atraso relevante
  return ATRASO_LABEL[ATRASO_ORDEM[max]] ?? "";
};

/* ================= UI PRIMITIVES ================= */

const Radio = ({ name, value, checked, onChange, label }: any) => (
  <label className={`block cursor-pointer rounded-2xl border-2 p-4 transition-all ${
    checked ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
  }`}>
    <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
    <div className="flex items-center gap-3">
      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
        checked ? "border-primary" : "border-weak"
      }`}>
        {checked && <span className="w-2.5 h-2.5 rounded-full bg-primary" />}
      </span>
      <span className="text-base font-medium">{label}</span>
    </div>
  </label>
);

const Check = ({ checked, onChange, label, disabled }: any) => (
  <label className={`block rounded-2xl border-2 p-4 transition-all ${
    disabled ? "opacity-50 cursor-not-allowed border-border bg-card"
    : checked ? "cursor-pointer border-primary bg-primary/5"
    : "cursor-pointer border-border bg-card hover:border-primary/40"
  }`}>
    <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} className="sr-only" />
    <div className="flex items-center gap-3">
      <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
        checked ? "border-primary bg-primary" : "border-weak"
      }`}>
        {checked && <svg className="w-3 h-3 text-primary-foreground" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" /></svg>}
      </span>
      <span className="text-base font-medium">{label}</span>
    </div>
  </label>
);

const Field = ({ label, hint, error, children }: any) => (
  <div>
    <label className="block text-base font-semibold mb-1.5 text-foreground">{label}</label>
    {hint && <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{hint}</p>}
    {!hint && <div className="mb-1.5" />}
    <div className={error ? "rounded-2xl ring-2 ring-primary/60 p-1 -m-1" : ""}>{children}</div>
    {error && <p className="mt-1.5 text-xs font-medium text-primary">Responda esta pergunta para continuar</p>}
  </div>
);

const RadioGroup = ({ name, options, value, onChange, error }: any) => (
  <div className="space-y-2">
    {options.map((op: Opt) => (
      <Radio key={op.v} name={name} value={op.v} checked={value === op.v} onChange={() => onChange(op.v)} label={op.l} />
    ))}
  </div>
);

const CheckGroup = ({ options, values, onToggle, error, disabledValues = [] }: any) => (
  <div className="space-y-2">
    {options.map((op: Opt) => (
      <Check
        key={op.v}
        checked={values.includes(op.v)}
        onChange={() => onToggle(op.v)}
        label={op.l}
        disabled={disabledValues.includes(op.v)}
      />
    ))}
  </div>
);

/** Select de instituição agrupado, com busca e opção "Outro" (texto livre) */
const InstituicaoPicker = ({ value, grupo, onChange, error }: {
  value: string; grupo: string;
  onChange: (instituicao: string, grupo: string) => void;
  error?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState("");
  const [outroMode, setOutroMode] = useState(grupo === "outro");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const gruposFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return INSTITUICOES;
    return INSTITUICOES
      .map((g) => ({ ...g, itens: g.itens.filter((i) => i.toLowerCase().includes(q)) }))
      .filter((g) => g.itens.length > 0);
  }, [busca]);

  const selecionar = (instituicao: string, g: string) => {
    onChange(instituicao, g);
    setOutroMode(false);
    setOpen(false);
    setBusca("");
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full rounded-2xl border bg-card px-4 py-3.5 text-left flex items-center justify-between gap-2 outline-none transition-colors ${
          error ? "border-primary" : "border-border focus:border-primary"
        }`}
      >
        <span className={value ? "text-base font-medium" : "text-base text-muted-foreground"}>
          {value || "Selecione a instituição"}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground ml-2" />
            <input
              autoFocus
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar instituição..."
              className="w-full py-2 pr-2 text-base bg-transparent outline-none"
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-2">
            {gruposFiltrados.map((g) => (
              <div key={g.grupo} className="mb-1">
                <p className="px-3 pt-2 pb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">{g.grupoLabel}</p>
                {g.itens.map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selecionar(i, g.grupo)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-base transition-colors ${
                      value === i ? "bg-primary/10 text-primary font-semibold" : "hover:bg-secondary"
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            ))}
            <button
              type="button"
              onClick={() => { setOutroMode(true); setOpen(false); onChange("", "outro"); }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-base font-medium text-primary hover:bg-primary/5"
            >
              Outra instituição (digitar)
            </button>
          </div>
        </div>
      )}

      {outroMode && (
        <input
          type="text"
          value={grupo === "outro" ? value : ""}
          onChange={(e) => onChange(e.target.value, "outro")}
          placeholder="Digite o nome da instituição"
          className={`mt-2 w-full rounded-2xl border bg-card px-4 py-3 text-base outline-none transition-colors ${
            error ? "border-primary" : "border-border focus:border-primary"
          }`}
        />
      )}
    </div>
  );
};

/* ================= ETAPAS ================= */

const stepIcons = [User, Banknote, Home, CreditCard, Shield, BellRing, Target];
const stepTitles = [
  "Vamos começar pelo básico",
  "Agora sobre a sua renda",
  "Quanto custa a sua vida",
  "Agora vamos detalhar cada dívida",
  "Sobre o seu patrimônio",
  "Como está a cobrança hoje",
  "Por último, o que você quer resolver",
];

const TOTAL_ETAPAS = 7;

/* ================= COMPONENTE ================= */

const Formulario = () => {
  const nav = useNavigate();

  // Restaura rascunho salvo (autosave)
  const draft = useMemo(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, []);

  const [screen, setScreen] = useState<"abertura" | "form">(draft?.step >= 1 ? "form" : "abertura");
  const [step, setStep] = useState<number>(draft?.step >= 1 ? draft.step : 1);
  const [dividaIndex, setDividaIndex] = useState<number>(typeof draft?.dividaIndex === "number" ? draft.dividaIndex : -1);
  const [data, setData] = useState<FormData>(draft?.data ? { ...emptyData, ...draft.data } : emptyData);
  const [startedAt] = useState<number>(draft?.startedAt ?? Date.now());
  const [attempted, setAttempted] = useState(false);
  const [avisoUrgencia, setAvisoUrgencia] = useState(false);

  // Sistema de créditos: o formulário só libera com um código válido
  const [credito, setCredito] = useState<string | null>(null);
  const [codigoInput, setCodigoInput] = useState("");
  const [verificandoCodigo, setVerificandoCodigo] = useState(false);
  const [checandoCredito, setChecandoCredito] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const salvo = localStorage.getItem("lvb_credito");
    if (!salvo) { setChecandoCredito(false); return; }
    (async () => {
      try {
        const { data: resp } = await supabase.functions.invoke("validar-credito", { body: { codigo: salvo } });
        if (resp?.valido) setCredito(salvo);
        else localStorage.removeItem("lvb_credito");
      } catch {
        // Sem conexão: deixa o usuário digitar o código novamente
      } finally {
        setChecandoCredito(false);
      }
    })();
  }, []);

  // Autosave: grava rascunho a cada mudança
  useEffect(() => {
    if (!credito) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ data, step, dividaIndex, startedAt }));
    } catch { /* storage cheio ou indisponível: segue sem rascunho */ }
  }, [data, step, dividaIndex, startedAt, credito]);

  const verificarCodigo = async (e: FormEvent) => {
    e.preventDefault();
    const codigo = codigoInput.trim().toUpperCase();
    if (codigo.length < 4) {
      toast({ title: "Atenção", description: "Digite o código que você recebeu por e-mail.", variant: "destructive" });
      return;
    }
    setVerificandoCodigo(true);
    try {
      const { data: resp, error } = await supabase.functions.invoke("validar-credito", { body: { codigo } });
      if (error) throw error;
      if (resp?.valido) {
        localStorage.setItem("lvb_credito", codigo);
        setCredito(codigo);
      } else {
        const msg = resp?.motivo === "usado"
          ? "Este código já foi utilizado. Cada crédito vale uma análise."
          : "Código não encontrado. Confira o e-mail que você recebeu após o pagamento.";
        toast({ title: "Código inválido", description: msg, variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro", description: "Não foi possível verificar o código. Tente novamente.", variant: "destructive" });
    } finally {
      setVerificandoCodigo(false);
    }
  };

  /* --------- atualização de dados --------- */

  const setSec = <S extends keyof FormData>(sec: S, patch: Partial<FormData[S]>) =>
    setData((p) => ({ ...p, [sec]: { ...(p[sec] as any), ...patch } }));

  const toggleTipoDivida = (v: string) =>
    setData((p) => {
      const tipos = p.tipos_divida.includes(v)
        ? p.tipos_divida.filter((x) => x !== v)
        : [...p.tipos_divida, v];
      // Sincroniza o array de sub-formulários com as modalidades marcadas
      const dividas = tipos.map((m) => p.dividas.find((d) => d.modalidade === m) ?? emptyDivida(m));
      return { ...p, tipos_divida: tipos, dividas };
    });

  const updateDivida = (index: number, patch: Partial<Divida>) =>
    setData((p) => ({
      ...p,
      dividas: p.dividas.map((d, i) => (i === index ? { ...d, ...patch } : d)),
    }));

  const toggleUrgencia = (v: string) => {
    setAvisoUrgencia(false);
    setData((p) => {
      const cur = p.objetivo.urgencia;
      if (cur.includes(v)) return { ...p, objetivo: { ...p.objetivo, urgencia: cur.filter((x) => x !== v) } };
      if (cur.length >= 2) { setAvisoUrgencia(true); return p; }
      return { ...p, objetivo: { ...p.objetivo, urgencia: [...cur, v] } };
    });
  };

  /* --------- validação por tela --------- */

  const mostrarQtdConsignados =
    data.tipos_divida.some((t) => t === "consignado" || t === "cartao_consignado") ||
    data.patrimonio.desconto_automatico === "folha_beneficio" ||
    data.patrimonio.desconto_automatico === "ambos";

  const missingFields = (): string[] => {
    const m: string[] = [];
    if (step === 1) {
      const i = data.identificacao;
      if (!i.nome_completo.trim()) m.push("nome_completo");
      if (!/^\S+@\S+\.\S+$/.test(i.email)) m.push("email");
      if (i.whatsapp.replace(/\D/g, "").length < 10) m.push("whatsapp");
      if (!i.cidade.trim()) m.push("cidade");
      if (!i.estado) m.push("estado");
      if (!i.faixa_idade) m.push("faixa_idade");
      if (!i.situacao_profissional) m.push("situacao_profissional");
    }
    if (step === 2) {
      const r = data.renda;
      for (const k of ["renda_liquida", "tipo_renda", "outra_renda_casa", "dependentes", "valor_total_dividas", "comprometimento_renda", "pagamento_minimos", "cpf_negativado"] as const) {
        if (!r[k]) m.push(k);
      }
    }
    if (step === 3) {
      const d = data.despesas;
      for (const k of ["tipo_moradia", "gasto_moradia", "gasto_alimentacao", "gasto_saude", "gasto_educacao", "gasto_transporte", "sobra_mensal"] as const) {
        if (!d[k]) m.push(k);
      }
      if (d.situacao_familiar.length === 0) m.push("situacao_familiar");
    }
    if (step === 4 && dividaIndex === -1) {
      if (data.tipos_divida.length === 0) m.push("tipos_divida");
    }
    if (step === 4 && dividaIndex >= 0) {
      const d = data.dividas[dividaIndex];
      if (d) {
        if (!d.instituicao.trim()) m.push("instituicao");
        for (const k of ["valor", "atraso", "formalizacao", "garantia", "coassinante", "finalidade"] as const) {
          if (!d[k]) m.push(k);
        }
        if (d.instituicao_grupo === "cooperativa" && !d.associado_cooperativa) m.push("associado_cooperativa");
      }
    }
    if (step === 5) {
      const p = data.patrimonio;
      if (p.bens.length === 0) m.push("bens");
      for (const k of ["socio_empresa", "avalista_terceiro", "salario_banco_credor", "desconto_automatico", "transferencia_bens"] as const) {
        if (!p[k]) m.push(k);
      }
      if (mostrarQtdConsignados && !p.qtd_consignados) m.push("qtd_consignados");
    }
    if (step === 6) {
      const c = data.cobranca;
      if (c.comunicacoes_recebidas.length === 0) m.push("comunicacoes_recebidas");
      if (!c.citado_processo) m.push("citado_processo");
      if (c.medidas_sofridas.length === 0) m.push("medidas_sofridas");
      if (!c.tentativa_negociacao) m.push("tentativa_negociacao");
      if (c.forma_cobranca.length === 0) m.push("forma_cobranca");
      if (!c.limpa_nome) m.push("limpa_nome");
      if (!c.acao_anterior) m.push("acao_anterior");
    }
    if (step === 7) {
      const ob = data.objetivo;
      if (ob.urgencia.length === 0) m.push("urgencia");
      if (!ob.prazo) m.push("prazo");
      if (!ob.capacidade_mensal) m.push("capacidade_mensal");
      if (!ob.valor_a_vista) m.push("valor_a_vista");
      if (!ob.aceite_lgpd) m.push("aceite_lgpd");
    }
    return m;
  };

  const faltando = attempted ? missingFields() : [];
  const hasErr = (k: string) => faltando.includes(k);

  /* --------- navegação --------- */

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const next = () => {
    if (missingFields().length > 0) {
      setAttempted(true);
      toast({ title: "Quase lá", description: "Responda as perguntas destacadas para continuar." });
      scrollTop();
      return;
    }
    setAttempted(false);
    if (step === 4 && dividaIndex === -1 && data.dividas.length > 0) {
      setDividaIndex(0);
    } else if (step === 4 && dividaIndex >= 0 && dividaIndex < data.dividas.length - 1) {
      setDividaIndex((i) => i + 1);
    } else if (step === 4) {
      setDividaIndex(-1);
      setStep(5);
    } else {
      setStep((s) => Math.min(TOTAL_ETAPAS, s + 1));
    }
    scrollTop();
  };

  const prev = () => {
    setAttempted(false);
    if (step === 4 && dividaIndex > 0) setDividaIndex((i) => i - 1);
    else if (step === 4 && dividaIndex === 0) setDividaIndex(-1);
    else if (step === 5) { setStep(4); setDividaIndex(data.dividas.length > 0 ? data.dividas.length - 1 : -1); }
    else if (step === 4 && dividaIndex === -1) setStep(3);
    else setStep((s) => Math.max(1, s - 1));
    scrollTop();
  };

  /* --------- envio --------- */

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (missingFields().length > 0) {
      setAttempted(true);
      toast({ title: "Quase lá", description: "Responda as perguntas destacadas para continuar." });
      scrollTop();
      return;
    }

    const i = data.identificacao;

    // Compatibilidade com a tela /analise (personalização, matriz de risco, curso)
    localStorage.setItem("lvb_nome", i.nome_completo);
    localStorage.setItem("lvb_email", i.email);
    localStorage.setItem("lvb_total_dividas", VALOR_TOTAL_DIVIDAS.find((x) => x.v === data.renda.valor_total_dividas)?.l ?? "");
    localStorage.setItem("lvb_tempo_divida", piorAtraso(data.dividas));
    const judicial =
      (data.cobranca.citado_processo && data.cobranca.citado_processo !== "nao") ||
      data.cobranca.comunicacoes_recebidas.some((c) => ["intimacao_cartorio", "carta_consolidacao", "oficial_justica", "carta_forum"].includes(c));
    localStorage.setItem("lvb_cobranca_judicial", judicial ? "sim" : "nao");
    localStorage.setItem("lvb_tipo_divida", data.tipos_divida.map(modalidadeLabel).join("|"));
    localStorage.setItem("lvb_analise", "");
    localStorage.setItem("lvb_analise_status", "pending");
    localStorage.setItem("lvb_usado", "true");
    localStorage.removeItem(DRAFT_KEY);

    // Elegibilidade ao curso: dívidas até ~R$ 50.000 (faixa mais próxima: 30k_60k)
    const elegivelCurso = ["ate_10k", "10k_30k", "30k_60k"].includes(data.renda.valor_total_dividas);

    const payload = sanitizePayload({
      identificacao: { ...data.identificacao },
      renda: { ...data.renda },
      despesas: { ...data.despesas },
      dividas: data.dividas.map((d) => ({ ...d })),
      patrimonio: { ...data.patrimonio },
      cobranca: { ...data.cobranca },
      objetivo: { ...data.objetivo, relato_livre: data.objetivo.relato_livre.slice(0, RELATO_MAX) },
      meta: {
        data_envio: new Date().toISOString(),
        origem: "site",
        tempo_preenchimento_segundos: Math.round((Date.now() - startedAt) / 1000),
      },
      codigo: credito || "",
      elegivel_curso: elegivelCurso,
      course_link: elegivelCurso ? COURSE_LINK : "",
    });

    // Dispara o fetch em background — não bloqueia a navegação
    (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000);

        const res = await fetch(N8N_WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify(payload),
        }).finally(() => clearTimeout(timeoutId));

        let analise = "";
        if (res.ok) {
          const text = await res.text();
          console.log("[n8n] raw response:", text.slice(0, 500));

          const isExpr = (s: any) => typeof s === "string" && s.includes("{{");
          const valid = (s: any) => typeof s === "string" && s.trim().length > 0 && !isExpr(s);

          try {
            const j: any = JSON.parse(text);
            const collectText = (value: any): string[] => {
              if (valid(value) && value.trim().length > 20) return [value.trim()];
              if (Array.isArray(value)) return value.flatMap(collectText);
              if (!value || typeof value !== "object") return [];
              const preferred = ["analise", "analysis", "resposta", "output", "text", "message", "content", "data"];
              const keys = [...preferred, ...Object.keys(value).filter((key) => !preferred.includes(key))];
              return keys.flatMap((key) => collectText(value[key]));
            };
            analise = Array.from(new Set(collectText(j))).join("\n\n");
          } catch {
            if (valid(text)) analise = text;
          }
        }

        // Consome o crédito somente após o envio bem-sucedido ao n8n
        if (res.ok && credito) {
          const { data: consumo } = await supabase.functions.invoke("consumir-credito", { body: { codigo: credito } });
          if (consumo?.ok) localStorage.removeItem("lvb_credito");
        }

        localStorage.setItem("lvb_analise", analise || "");
        localStorage.setItem("lvb_analise_status", analise ? "ready" : "email_only");
        window.dispatchEvent(new CustomEvent("lvb:analise-updated"));
      } catch (err: any) {
        console.error("[n8n] fetch falhou:", err?.name, err?.message, err);
        localStorage.setItem("lvb_analise_status", "email_only");
        window.dispatchEvent(new CustomEvent("lvb:analise-updated"));
      }
    })();

    nav("/analise");
  };

  /* --------- telas de portão (crédito) --------- */

  if (checandoCredito) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!credito) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-5 py-12">
        <div className="lvb-card max-w-md w-full p-8 md:p-10 text-center animate-fade-up">
          <div className="flex justify-center"><LvbLogo size="lg" /></div>
          <div className="mt-6 mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <KeyRound className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-serif-lvb mt-5 text-2xl md:text-3xl font-bold leading-tight">
            Digite seu código de acesso
          </h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Após o pagamento, você recebe um código por e-mail (ex: LVB-XXXXX).
            Ele é o seu crédito para uma análise: <strong className="text-foreground">não expira</strong> e
            só é utilizado quando você enviar o formulário.
          </p>
          <form onSubmit={verificarCodigo} className="mt-6 space-y-3">
            <input
              type="text"
              value={codigoInput}
              onChange={(e) => setCodigoInput(e.target.value.toUpperCase())}
              placeholder="LVB-XXXXX"
              autoComplete="off"
              maxLength={12}
              className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-center text-lg font-semibold tracking-[0.2em] uppercase outline-none focus:border-primary transition-colors"
            />
            <button
              type="submit"
              disabled={verificandoCodigo}
              className="btn-cta pill bg-primary hover:bg-primary-hover text-primary-foreground w-full px-6 py-4 font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {verificandoCodigo ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Liberar meu formulário <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>
          <p className="mt-5 text-xs text-muted-foreground">
            Ainda não tem um código?{" "}
            <a href={CAKTO_LINK} target="_blank" rel="noopener noreferrer"
              className="text-primary font-semibold underline underline-offset-2">
              Adquira sua análise
            </a>
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Pagou e não recebeu o código?{" "}
            <a href={WHATSAPP_SUPORTE} target="_blank" rel="noopener noreferrer"
              className="text-primary font-semibold underline underline-offset-2">
              Fale com a equipe
            </a>
          </p>
        </div>
      </div>
    );
  }

  /* --------- tela de abertura --------- */

  if (screen === "abertura") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-5 py-12">
        <div className="lvb-card max-w-xl w-full p-8 md:p-10 text-center animate-fade-up">
          <div className="flex justify-center"><LvbLogo size="lg" /></div>
          <h1 className="font-serif-lvb mt-6 text-3xl md:text-4xl font-bold leading-tight text-primary">
            Diagnóstico da sua situação financeira
          </h1>
          <p className="mt-4 text-base text-foreground/85 leading-relaxed">
            Responda com calma. Quanto mais preciso você for, mais completa vai ser a análise que você recebe.
          </p>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            São 7 etapas e leva cerca de 6 minutos. Suas respostas são confidenciais e usadas apenas
            para elaborar o seu relatório.
          </p>
          <button
            type="button"
            onClick={() => { setScreen("form"); scrollTop(); }}
            className="btn-cta mt-8 pill bg-primary hover:bg-primary-hover text-primary-foreground px-8 py-4 font-semibold inline-flex items-center justify-center gap-2 w-full"
          >
            Começar <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  /* --------- formulário --------- */

  const Icon = stepIcons[step - 1];
  const totalDividas = data.dividas.length;
  const emSubDivida = step === 4 && dividaIndex >= 0;
  const dividaAtual = emSubDivida ? data.dividas[dividaIndex] : null;

  // Progresso: etapa 4 tem (1 + N) telas
  const progress = emSubDivida || (step === 4 && dividaIndex === -1)
    ? ((step - 1) / TOTAL_ETAPAS) * 100 + ((dividaIndex + 1) / Math.max(1, totalDividas + 1)) * (100 / TOTAL_ETAPAS)
    : (step / TOTAL_ETAPAS) * 100;

  const tituloEtapa = emSubDivida
    ? `Sobre a sua dívida de ${modalidadeLabel(dividaAtual!.modalidade)}`
    : stepTitles[step - 1];

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="sticky top-0 z-50 glass-header border-b border-border">
        <div className="container max-w-3xl flex items-center justify-between py-3">
          <LvbLogo size="md" />
          <span className="text-sm font-semibold text-muted-foreground">
            Etapa {step} de {TOTAL_ETAPAS}
            {emSubDivida && ` · Dívida ${dividaIndex + 1} de ${totalDividas}`}
          </span>
        </div>
      </header>

      <div className="container max-w-3xl pt-6">
        <div className="flex justify-between text-sm font-semibold mb-2">
          <span>Etapa {step} de {TOTAL_ETAPAS}</span>
          <span className="text-primary">{Math.round(progress)}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: "var(--gradient-progress)" }} />
        </div>
      </div>

      <form onSubmit={submit} className="container max-w-3xl mt-8">
        <div className="lvb-card p-6 md:p-8 animate-fade-up" key={`${step}-${dividaIndex}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <h2 className="font-serif-lvb text-2xl md:text-3xl font-bold text-primary leading-tight">{tituloEtapa}</h2>
          </div>

          {step === 3 && (
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Essa parte é importante. É com ela que eu calculo se a sua renda está sendo consumida
              além do que a lei considera aceitável.
            </p>
          )}

          <div className="space-y-7 mt-4">
            {/* ============ ETAPA 1 · IDENTIFICAÇÃO ============ */}
            {step === 1 && (
              <>
                <Field label="Nome completo *" error={hasErr("nome_completo")}>
                  <input type="text" value={data.identificacao.nome_completo}
                    onChange={(e) => setSec("identificacao", { nome_completo: e.target.value })}
                    className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-base outline-none focus:border-primary transition-colors"
                    placeholder="Seu nome completo" />
                </Field>
                <Field label="E-mail *" error={hasErr("email")}>
                  <input type="email" value={data.identificacao.email}
                    onChange={(e) => setSec("identificacao", { email: e.target.value })}
                    className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-base outline-none focus:border-primary"
                    placeholder="voce@email.com" />
                </Field>
                <Field label="WhatsApp *" error={hasErr("whatsapp")}>
                  <input type="tel" value={data.identificacao.whatsapp}
                    onChange={(e) => setSec("identificacao", { whatsapp: maskPhone(e.target.value) })}
                    className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-base outline-none focus:border-primary"
                    placeholder="(00) 00000-0000" />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Cidade *" error={hasErr("cidade")}>
                    <input type="text" value={data.identificacao.cidade}
                      onChange={(e) => setSec("identificacao", { cidade: e.target.value })}
                      className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-base outline-none focus:border-primary"
                      placeholder="Sua cidade" />
                  </Field>
                  <Field label="Estado *" error={hasErr("estado")}>
                    <select value={data.identificacao.estado}
                      onChange={(e) => setSec("identificacao", { estado: e.target.value })}
                      className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-base outline-none focus:border-primary">
                      <option value="">Selecione</option>
                      {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Qual sua faixa de idade? *" error={hasErr("faixa_idade")}>
                  <RadioGroup name="faixa_idade" options={FAIXA_IDADE} value={data.identificacao.faixa_idade}
                    onChange={(v: string) => setSec("identificacao", { faixa_idade: v })} />
                </Field>
                <Field label="Qual a sua situação profissional hoje? *" error={hasErr("situacao_profissional")}>
                  <RadioGroup name="situacao_profissional" options={SITUACAO_PROFISSIONAL} value={data.identificacao.situacao_profissional}
                    onChange={(v: string) => setSec("identificacao", { situacao_profissional: v })} />
                </Field>
              </>
            )}

            {/* ============ ETAPA 2 · RENDA ============ */}
            {step === 2 && (
              <>
                <Field label="Qual a sua renda mensal líquida? *"
                  hint="O que realmente cai na sua conta, depois de todos os descontos."
                  error={hasErr("renda_liquida")}>
                  <RadioGroup name="renda_liquida" options={RENDA_LIQUIDA} value={data.renda.renda_liquida}
                    onChange={(v: string) => setSec("renda", { renda_liquida: v })} />
                </Field>
                <Field label="Sua renda é *" error={hasErr("tipo_renda")}>
                  <RadioGroup name="tipo_renda" options={TIPO_RENDA} value={data.renda.tipo_renda}
                    onChange={(v: string) => setSec("renda", { tipo_renda: v })} />
                </Field>
                <Field label="Existe outra renda na sua casa? *" error={hasErr("outra_renda_casa")}>
                  <RadioGroup name="outra_renda_casa" options={OUTRA_RENDA} value={data.renda.outra_renda_casa}
                    onChange={(v: string) => setSec("renda", { outra_renda_casa: v })} />
                </Field>
                <Field label="Quantas pessoas dependem de você financeiramente? *" error={hasErr("dependentes")}>
                  <RadioGroup name="dependentes" options={DEPENDENTES} value={data.renda.dependentes}
                    onChange={(v: string) => setSec("renda", { dependentes: v })} />
                </Field>
                <Field label="Qual o valor total aproximado das suas dívidas? *" error={hasErr("valor_total_dividas")}>
                  <RadioGroup name="valor_total_dividas" options={VALOR_TOTAL_DIVIDAS} value={data.renda.valor_total_dividas}
                    onChange={(v: string) => setSec("renda", { valor_total_dividas: v })} />
                </Field>
                <Field label="Quanto da sua renda vai para dívida hoje? *" error={hasErr("comprometimento_renda")}>
                  <RadioGroup name="comprometimento_renda" options={COMPROMETIMENTO} value={data.renda.comprometimento_renda}
                    onChange={(v: string) => setSec("renda", { comprometimento_renda: v })} />
                </Field>
                <Field label="Você tem conseguido pagar os valores mínimos? *" error={hasErr("pagamento_minimos")}>
                  <RadioGroup name="pagamento_minimos" options={PAGAMENTO_MINIMOS} value={data.renda.pagamento_minimos}
                    onChange={(v: string) => setSec("renda", { pagamento_minimos: v })} />
                </Field>
                <Field label="Seu CPF está negativado? *" error={hasErr("cpf_negativado")}>
                  <RadioGroup name="cpf_negativado" options={CPF_NEGATIVADO} value={data.renda.cpf_negativado}
                    onChange={(v: string) => setSec("renda", { cpf_negativado: v })} />
                </Field>
              </>
            )}

            {/* ============ ETAPA 3 · DESPESAS ============ */}
            {step === 3 && (
              <>
                <Field label="Sua moradia é *" error={hasErr("tipo_moradia")}>
                  <RadioGroup name="tipo_moradia" options={TIPO_MORADIA} value={data.despesas.tipo_moradia}
                    onChange={(v: string) => setSec("despesas", { tipo_moradia: v })} />
                </Field>
                <Field label="Quanto você gasta por mês com moradia? *"
                  hint="Some aluguel ou prestação, condomínio, IPTU, luz, água, gás e internet."
                  error={hasErr("gasto_moradia")}>
                  <RadioGroup name="gasto_moradia" options={GASTO_MORADIA} value={data.despesas.gasto_moradia}
                    onChange={(v: string) => setSec("despesas", { gasto_moradia: v })} />
                </Field>
                <Field label="Quanto gasta por mês com alimentação da família? *" error={hasErr("gasto_alimentacao")}>
                  <RadioGroup name="gasto_alimentacao" options={GASTO_ALIMENTACAO} value={data.despesas.gasto_alimentacao}
                    onChange={(v: string) => setSec("despesas", { gasto_alimentacao: v })} />
                </Field>
                <Field label="Quanto gasta por mês com saúde? *"
                  hint="Plano de saúde, remédios de uso contínuo, tratamentos."
                  error={hasErr("gasto_saude")}>
                  <RadioGroup name="gasto_saude" options={GASTO_SAUDE} value={data.despesas.gasto_saude}
                    onChange={(v: string) => setSec("despesas", { gasto_saude: v })} />
                </Field>
                <Field label="Quanto gasta por mês com educação? *" error={hasErr("gasto_educacao")}>
                  <RadioGroup name="gasto_educacao" options={GASTO_EDUCACAO} value={data.despesas.gasto_educacao}
                    onChange={(v: string) => setSec("despesas", { gasto_educacao: v })} />
                </Field>
                <Field label="Quanto gasta por mês com transporte? *" error={hasErr("gasto_transporte")}>
                  <RadioGroup name="gasto_transporte" options={GASTO_TRANSPORTE} value={data.despesas.gasto_transporte}
                    onChange={(v: string) => setSec("despesas", { gasto_transporte: v })} />
                </Field>
                <Field label="Existe alguma dessas situações na sua família? *" error={hasErr("situacao_familiar")}>
                  <CheckGroup options={SITUACAO_FAMILIAR} values={data.despesas.situacao_familiar}
                    onToggle={(v: string) => setSec("despesas", { situacao_familiar: toggleMulti(data.despesas.situacao_familiar, v, "nenhuma") })} />
                </Field>
                <Field label="Depois de pagar o essencial e as dívidas, quanto sobra? *" error={hasErr("sobra_mensal")}>
                  <RadioGroup name="sobra_mensal" options={SOBRA_MENSAL} value={data.despesas.sobra_mensal}
                    onChange={(v: string) => setSec("despesas", { sobra_mensal: v })} />
                </Field>
              </>
            )}

            {/* ============ ETAPA 4.1 · SELEÇÃO DE MODALIDADES ============ */}
            {step === 4 && dividaIndex === -1 && (
              <>
                <p className="text-sm text-muted-foreground leading-relaxed -mt-2">
                  Marque todos os tipos que você tem. Depois eu vou te perguntar sobre cada um
                  separadamente, porque cada tipo funciona de um jeito diferente.
                </p>
                <Field label="Quais tipos de dívida você tem? *" error={hasErr("tipos_divida")}>
                  <CheckGroup options={TIPOS_DIVIDA} values={data.tipos_divida} onToggle={toggleTipoDivida} />
                </Field>
                {data.tipos_divida.length > 6 && (
                  <div className="rounded-2xl border border-gold/40 bg-gold/5 p-4 text-sm text-foreground/85 leading-relaxed">
                    São várias dívidas. Vou te perguntar sobre cada uma, leva mais alguns minutos,
                    mas é isso que deixa a análise precisa.
                  </div>
                )}
              </>
            )}

            {/* ============ ETAPA 4.2 · SUB-FORMULÁRIO POR DÍVIDA ============ */}
            {step === 4 && dividaAtual && (
              <>
                <Field label="Qual instituição? *" error={hasErr("instituicao")}>
                  <InstituicaoPicker
                    value={dividaAtual.instituicao}
                    grupo={dividaAtual.instituicao_grupo}
                    onChange={(inst, grp) => updateDivida(dividaIndex, {
                      instituicao: inst, instituicao_grupo: grp,
                      ...(grp !== "cooperativa" ? { associado_cooperativa: "" } : {}),
                    })}
                    error={hasErr("instituicao")}
                  />
                </Field>
                {dividaAtual.instituicao_grupo === "cooperativa" && (
                  <Field label="Você é ou era associado dessa cooperativa, com conta e cota? *" error={hasErr("associado_cooperativa")}>
                    <RadioGroup name={`assoc_${dividaIndex}`} options={ASSOCIADO_COOP} value={dividaAtual.associado_cooperativa}
                      onChange={(v: string) => updateDivida(dividaIndex, { associado_cooperativa: v })} />
                  </Field>
                )}
                <Field label="Qual o valor aproximado dessa dívida? *" error={hasErr("valor")}>
                  <RadioGroup name={`valor_${dividaIndex}`} options={VALOR_DIVIDA} value={dividaAtual.valor}
                    onChange={(v: string) => updateDivida(dividaIndex, { valor: v })} />
                </Field>
                <Field label="Há quanto tempo essa dívida está atrasada? *" error={hasErr("atraso")}>
                  <RadioGroup name={`atraso_${dividaIndex}`} options={ATRASO} value={dividaAtual.atraso}
                    onChange={(v: string) => updateDivida(dividaIndex, { atraso: v })} />
                </Field>
                <Field label="Como essa dívida foi feita? *"
                  hint="Essa é a pergunta mais importante do formulário. É ela que define o que o banco pode fazer."
                  error={hasErr("formalizacao")}>
                  <RadioGroup name={`formalizacao_${dividaIndex}`} options={FORMALIZACAO} value={dividaAtual.formalizacao}
                    onChange={(v: string) => updateDivida(dividaIndex, { formalizacao: v })} />
                </Field>
                <Field label="Essa dívida tem algum bem em garantia? *" error={hasErr("garantia")}>
                  <RadioGroup name={`garantia_${dividaIndex}`} options={GARANTIA} value={dividaAtual.garantia}
                    onChange={(v: string) => updateDivida(dividaIndex, { garantia: v })} />
                </Field>
                <Field label="Alguém assinou junto com você? *" error={hasErr("coassinante")}>
                  <RadioGroup name={`coassinante_${dividaIndex}`} options={COASSINANTE} value={dividaAtual.coassinante}
                    onChange={(v: string) => updateDivida(dividaIndex, { coassinante: v })} />
                </Field>
                <Field label="Essa dívida foi feita para *" error={hasErr("finalidade")}>
                  <RadioGroup name={`finalidade_${dividaIndex}`} options={FINALIDADE} value={dividaAtual.finalidade}
                    onChange={(v: string) => updateDivida(dividaIndex, { finalidade: v })} />
                </Field>
              </>
            )}

            {/* ============ ETAPA 5 · BENS E GARANTIAS ============ */}
            {step === 5 && (
              <>
                <Field label="Você tem algum destes bens? *" error={hasErr("bens")}>
                  <CheckGroup options={BENS} values={data.patrimonio.bens}
                    onToggle={(v: string) => setSec("patrimonio", { bens: toggleMulti(data.patrimonio.bens, v, "nenhum") })} />
                </Field>
                <Field label="Você é sócio ou dono de alguma empresa? *" error={hasErr("socio_empresa")}>
                  <RadioGroup name="socio_empresa" options={SOCIO_EMPRESA} value={data.patrimonio.socio_empresa}
                    onChange={(v: string) => setSec("patrimonio", { socio_empresa: v })} />
                </Field>
                <Field label="Você assinou como avalista ou fiador de outra pessoa? *" error={hasErr("avalista_terceiro")}>
                  <RadioGroup name="avalista_terceiro" options={AVALISTA_TERCEIRO} value={data.patrimonio.avalista_terceiro}
                    onChange={(v: string) => setSec("patrimonio", { avalista_terceiro: v })} />
                </Field>
                <Field label="Você recebe salário ou benefício no mesmo banco em que deve? *" error={hasErr("salario_banco_credor")}>
                  <RadioGroup name="salario_banco_credor" options={SALARIO_BANCO} value={data.patrimonio.salario_banco_credor}
                    onChange={(v: string) => setSec("patrimonio", { salario_banco_credor: v })} />
                </Field>
                <Field label="Existe débito automático ou desconto direto autorizado? *" error={hasErr("desconto_automatico")}>
                  <RadioGroup name="desconto_automatico" options={DESCONTO_AUTOMATICO} value={data.patrimonio.desconto_automatico}
                    onChange={(v: string) => setSec("patrimonio", { desconto_automatico: v })} />
                </Field>
                {mostrarQtdConsignados && (
                  <Field label="Quantos contratos de consignado ou cartão consignado você tem? *" error={hasErr("qtd_consignados")}>
                    <RadioGroup name="qtd_consignados" options={QTD_CONSIGNADOS} value={data.patrimonio.qtd_consignados}
                      onChange={(v: string) => setSec("patrimonio", { qtd_consignados: v })} />
                  </Field>
                )}
                <Field label="Nos últimos 12 meses você transferiu, vendeu ou passou para o nome de alguém algum bem seu? *"
                  hint="Pergunto sem julgamento. É informação técnica importante para a sua análise."
                  error={hasErr("transferencia_bens")}>
                  <RadioGroup name="transferencia_bens" options={TRANSFERENCIA_BENS} value={data.patrimonio.transferencia_bens}
                    onChange={(v: string) => setSec("patrimonio", { transferencia_bens: v })} />
                </Field>
              </>
            )}

            {/* ============ ETAPA 6 · COBRANÇA E PROCESSOS ============ */}
            {step === 6 && (
              <>
                <Field label="Você recebeu alguma dessas comunicações? *" error={hasErr("comunicacoes_recebidas")}>
                  <CheckGroup options={COMUNICACOES} values={data.cobranca.comunicacoes_recebidas}
                    onToggle={(v: string) => setSec("cobranca", { comunicacoes_recebidas: toggleMulti(data.cobranca.comunicacoes_recebidas, v, "nenhuma") })} />
                </Field>
                <Field label="Você já foi citado em algum processo? *" error={hasErr("citado_processo")}>
                  <RadioGroup name="citado_processo" options={CITADO_PROCESSO} value={data.cobranca.citado_processo}
                    onChange={(v: string) => setSec("cobranca", { citado_processo: v })} />
                </Field>
                <Field label="Você já sofreu alguma dessas medidas? *" error={hasErr("medidas_sofridas")}>
                  <CheckGroup options={MEDIDAS} values={data.cobranca.medidas_sofridas}
                    onToggle={(v: string) => setSec("cobranca", { medidas_sofridas: toggleMulti(data.cobranca.medidas_sofridas, v, "nenhuma") })} />
                </Field>
                <Field label="Você já tentou negociar direto com o banco? *" error={hasErr("tentativa_negociacao")}>
                  <RadioGroup name="tentativa_negociacao" options={TENTATIVA_NEGOCIACAO} value={data.cobranca.tentativa_negociacao}
                    onChange={(v: string) => setSec("cobranca", { tentativa_negociacao: v })} />
                </Field>
                <Field label="Como está sendo a cobrança? *" error={hasErr("forma_cobranca")}>
                  <CheckGroup options={FORMA_COBRANCA} values={data.cobranca.forma_cobranca}
                    onToggle={(v: string) => setSec("cobranca", { forma_cobranca: toggleMulti(data.cobranca.forma_cobranca, v) })} />
                </Field>
                <Field label='Você já contratou "limpa nome", assessoria de crédito ou serviço parecido? *' error={hasErr("limpa_nome")}>
                  <RadioGroup name="limpa_nome" options={LIMPA_NOME} value={data.cobranca.limpa_nome}
                    onChange={(v: string) => setSec("cobranca", { limpa_nome: v })} />
                </Field>
                <Field label="Você já entrou com alguma ação contra banco ou já teve ação de superendividamento? *" error={hasErr("acao_anterior")}>
                  <RadioGroup name="acao_anterior" options={ACAO_ANTERIOR} value={data.cobranca.acao_anterior}
                    onChange={(v: string) => setSec("cobranca", { acao_anterior: v })} />
                </Field>
              </>
            )}

            {/* ============ ETAPA 7 · OBJETIVO ============ */}
            {step === 7 && (
              <>
                <Field label="O que é mais urgente para você agora? *"
                  hint="Escolha no máximo 2."
                  error={hasErr("urgencia")}>
                  <CheckGroup options={URGENCIA} values={data.objetivo.urgencia}
                    onToggle={toggleUrgencia}
                    disabledValues={data.objetivo.urgencia.length >= 2
                      ? URGENCIA.filter((x) => !data.objetivo.urgencia.includes(x.v)).map((x) => x.v)
                      : []} />
                  {avisoUrgencia && (
                    <p className="mt-2 text-xs font-medium text-primary">Escolha no máximo 2.</p>
                  )}
                </Field>
                <Field label="Qual o seu prazo? *" error={hasErr("prazo")}>
                  <RadioGroup name="prazo" options={PRAZO} value={data.objetivo.prazo}
                    onChange={(v: string) => setSec("objetivo", { prazo: v })} />
                </Field>
                <Field label="Quanto você consegue destinar por mês para resolver isso? *" error={hasErr("capacidade_mensal")}>
                  <RadioGroup name="capacidade_mensal" options={CAPACIDADE_MENSAL} value={data.objetivo.capacidade_mensal}
                    onChange={(v: string) => setSec("objetivo", { capacidade_mensal: v })} />
                </Field>
                <Field label="Você teria algum valor à vista para uma quitação com desconto? *" error={hasErr("valor_a_vista")}>
                  <RadioGroup name="valor_a_vista" options={VALOR_A_VISTA} value={data.objetivo.valor_a_vista}
                    onChange={(v: string) => setSec("objetivo", { valor_a_vista: v })} />
                </Field>
                <Field label="Me conta com suas palavras o que está acontecendo"
                  hint="Escreva o que quiser. Isso me ajuda a entender coisas que as perguntas não capturam.">
                  <textarea
                    value={data.objetivo.relato_livre}
                    onChange={(e) => setSec("objetivo", { relato_livre: e.target.value.slice(0, RELATO_MAX) })}
                    rows={6}
                    maxLength={RELATO_MAX}
                    className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-base outline-none focus:border-primary resize-none"
                    placeholder="Conte um pouco mais sobre sua situação..."
                  />
                  <div className="mt-1 text-right text-xs text-muted-foreground">
                    {data.objetivo.relato_livre.length}/{RELATO_MAX}
                  </div>
                </Field>
                <div className={`rounded-2xl border-2 p-5 ${
                  hasErr("aceite_lgpd") ? "border-primary/60 bg-primary/5" : "border-gold/40 bg-gold/5"
                }`}>
                  <h3 className="font-bold flex items-center gap-2"><Shield className="w-4 h-4 text-gold" /> Autorização LGPD *</h3>
                  <Check
                    checked={data.objetivo.aceite_lgpd}
                    onChange={() => setSec("objetivo", { aceite_lgpd: !data.objetivo.aceite_lgpd })}
                    label={
                      <span>
                        Autorizo o contato do escritório e o tratamento dos meus dados para elaboração
                        da minha análise, conforme a Lei Geral de Proteção de Dados.{" "}
                        <a href="/privacidade" target="_blank" rel="noopener noreferrer"
                          className="text-primary underline underline-offset-2 text-sm">
                          Política de Privacidade
                        </a>
                      </span>
                    }
                  />
                  {hasErr("aceite_lgpd") && (
                    <p className="mt-2 text-xs font-medium text-primary">É necessário autorizar para gerar a análise</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3 justify-between">
          {(step > 1 || emSubDivida) ? (
            <button type="button" onClick={prev}
              className="pill border border-border bg-card hover:bg-secondary hover:border-primary/30 px-6 py-3.5 font-semibold inline-flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
          ) : <span />}
          {step < TOTAL_ETAPAS ? (
            <button type="button" onClick={next}
              className="btn-cta pill bg-primary hover:bg-primary-hover text-primary-foreground px-7 py-3.5 font-semibold inline-flex items-center justify-center gap-2">
              Continuar <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button type="submit"
              className="btn-cta pill bg-primary hover:bg-primary-hover text-primary-foreground px-7 py-3.5 font-semibold inline-flex items-center justify-center gap-2">
              Receber minha análise <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default Formulario;
