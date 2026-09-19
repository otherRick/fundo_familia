/**
 * Dados de referência dos ativos (seed/fallback).
 *
 * A classificação por setor e tipo passa a viver na tabela `assets` do Supabase.
 * Este array é usado como seed da migração e como fallback quando o Supabase
 * não está configurado. Ativos sem setor aparecem como "Outros".
 */
export type Asset = {
  ticker: string;
  name: string;
  sector: string;
  type: string;
};

export const assetSeed: Asset[] = [
  { ticker: "BBAS3", name: "Banco do Brasil", sector: "Financeiro", type: "Ação" },
  { ticker: "CMIG4", name: "Cemig", sector: "Energia Elétrica", type: "Ação" },
  { ticker: "KLBN3", name: "Klabin", sector: "Papel e Celulose", type: "Ação" },
  { ticker: "SAPR4", name: "Sanepar", sector: "Saneamento", type: "Ação" },
  { ticker: "TAEE3", name: "Taesa", sector: "Energia Elétrica", type: "Ação" },
  { ticker: "USIM3", name: "Usiminas", sector: "Siderurgia", type: "Ação" },
  { ticker: "MXRF11", name: "Maxi Renda", sector: "Fundos Imobiliários", type: "FII" },
  { ticker: "VINO11", name: "Vinci Offices", sector: "Fundos Imobiliários", type: "FII" },
];
