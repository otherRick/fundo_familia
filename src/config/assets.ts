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
  { ticker: "PETR4", name: "Petrobras", sector: "Petróleo e Gás", type: "Ação" },
  { ticker: "BBAS3", name: "Banco do Brasil", sector: "Financeiro", type: "Ação" },
  { ticker: "TAEE11", name: "Taesa", sector: "Energia", type: "Unit" },
  { ticker: "MXRF11", name: "Maxi Renda", sector: "Fundos Imobiliários", type: "FII" },
];
