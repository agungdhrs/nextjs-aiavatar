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

## Troubleshooting n8n webhook 500 errors 🚨

If your app logs show a 500 Internal Server Error when fetching the n8n GET webhook (e.g. `N8N_WEBHOOK_GET_URL`), curl or the server logs may show a JSON body like:

```
{"code":0,"message":"Unused Respond to Webhook node found in the workflow"}
```

What this means: n8n has a "Respond to Webhook" node included in the workflow but it is not connected/used — n8n treats that as a configuration issue and returns 500.

How to fix:

- Open the n8n editor for the workflow attached to your webhook.
- Find any "Respond to Webhook" node that is not connected to the rest of the flow and either remove it or connect it correctly.
- Ensure the webhook's final node returns a response (or use a properly configured "Respond to Webhook" node).

After fixing the workflow, retry the GET request from the app — the endpoint should return a 200 and valid JSON.

## Submitting multiple scheduled posts at once

The UI now supports adding multiple rows to schedule several posts in one go.

- Click "Tambah baris" to add another row, or "Hapus" to remove a row.
- Use the numeric "Planned" field to create that many input rows instantly (min 1, max 20).
- Each row requires Tema, Tanggal and Jam.
- The client will send each row to your n8n POST webhook (`N8N_WEBHOOK_URL`) sequentially. If any item fails, the form will return an aggregate error message.

If you want to debug or simulate multi-row submissions from the terminal you can post multiple payloads sequentially (example):

```bash
curl -X POST http://localhost:5678/webhook/input-jadwal \
	-H 'Content-Type: application/json' \
	-H 'x-api-key: rahasia123' \
	-d '{"Tema Postingan":"First","Tanggal Posting":"2025-12-10","Jam":"10:00"}'

curl -X POST http://localhost:5678/webhook/input-jadwal \
	-H 'Content-Type: application/json' \
	-H 'x-api-key: rahasia123' \
	-d '{"Tema Postingan":"Second","Tanggal Posting":"2025-12-11","Jam":"11:00"}'
```

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
