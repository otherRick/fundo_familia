This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### Supabase heartbeat

O GitHub Actions consulta a tabela `contributions` três vezes por dia. A Vercel
faz a mesma consulta em horários intercalados pelo cron definido em
`vercel.json`. Ambos precisam de `SUPABASE_URL` e
`SUPABASE_SERVICE_ROLE_KEY` no ambiente correspondente.

Para ativar o cron da Vercel, configure `CRON_SECRET` como variável de ambiente
no ambiente **Production** do projeto e faça um novo deploy. A Vercel envia
`Authorization: Bearer <CRON_SECRET>` à rota
`/api/cron/supabase-heartbeat`; sem essa variável, a rota responde `401` e
não consulta o banco. O segredo deve ser longo e aleatório, e nunca deve ser
incluído no repositório.

Os cron jobs não reativam um projeto Supabase já pausado. Depois de reativá-lo,
execute manualmente o workflow `Heartbeat keep-alive` no GitHub e verifique
um resultado `200`. Em seguida, confira a execução do cron na Vercel.
