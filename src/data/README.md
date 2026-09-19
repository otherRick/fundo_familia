# Dados do Fundo Família

O backend usa **Supabase** (Postgres). Os arquivos JSON desta pasta são usados
como **fallback** (quando o Supabase não está configurado) e como **seed** da migração.

## Tabelas no Supabase

- `contributions` — contribuições (person_name, amount, contribution_date).
- `b3_operations` — operações históricas importadas do XLSX da B3.
- `positions` — posições consolidadas (derivadas das operações).
- `assets` — referência de ativos (nome, setor, tipo).

O schema SQL está em `supabase/schema.sql`.

## Migração (JSON -> Supabase)

```bash
yarn migrate
```

Lê `contributions.json`, ignora valores 0/vazios, insere no Supabase (evitando
duplicatas) e sincroniza os ativos de referência (`src/config/assets.ts`).

## Importar XLSX da B3

```bash
yarn import:b3 <caminho/para/negociacoes.xlsx>
```

Normaliza as operações, grava em `b3_operations` (com deduplicação), reconsolida
e grava as posições em `positions`. Também atualiza `positions.json` (snapshot local).

## `contributions.json`

Formato antigo: `ano -> pessoa -> valor`. Usado apenas como seed/fallback da migração.
Valores 0/vazios representam ausência de contribuição e não geram registros.

## `positions.json`

Snapshot local das posições (fallback). Gerado por `yarn import:b3`.

## Setores e tipos

Vivem na tabela `assets` do Supabase. O seed/fallback fica em `src/config/assets.ts`.
Ativos sem setor aparecem como "Outros".

## Cotações (BRAPI)

Continuam sendo buscadas no servidor via `src/lib/brapi.ts` (não são salvas no banco).
Variável de ambiente: `BRAPI_TOKEN` (nunca exposta ao client).


