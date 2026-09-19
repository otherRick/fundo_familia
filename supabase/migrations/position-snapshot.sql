-- ============================================================
-- Migração: posição atual da B3 (snapshot, abas Acoes e FIIs)
-- Execute no SQL Editor do Supabase para atualizar a tabela `positions`.
-- ============================================================

alter table public.positions
  add column if not exists type text not null default '',
  add column if not exists b3_closing_price numeric(14, 4),
  add column if not exists b3_value numeric(14, 2);

-- O XLSX de posição NÃO fornece preço médio/custo. Esses campos passam a ser
-- opcionais e virão do histórico de negociações (futuro).
alter table public.positions alter column average_price drop not null;
alter table public.positions alter column invested_value drop not null;
