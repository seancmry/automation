# HR AI HITL — Vercel AI SDK + Odoo

## The problem

HR teams need internal case notes written quickly. If AI saves straight into the employee file, a wrong draft becomes an official record with nobody noticing.

**What this program does:** it drafts a note with AI, then waits for a **human approve**. Nothing is written to the system of record until someone clicks yes. Odoo stands in for a real HRIS/ERP. Cases are synthetic — safe to demo and share.

```
HRBP UI (Next.js)
    → streamText (Vercel AI SDK)
    → human Approve / Discard
    → Odoo JSON-RPC  (or data/mock-writes.json)
```

Stack in short: Vercel AI SDK, Next.js App Router, optional Docker Odoo, light eval checks before write.

## Who it helps

- People learning **human-in-the-loop** AI on a real-looking workbench  
- Hiring managers evaluating a small full-stack TS demo  
- Anyone who wants a teachable “approve before save” pattern without real employee data  

## How to run

### Quick start (mock Odoo — no Docker)

```bash
cd collected_projects/hr_ai_hitl   # or your clone path
cp .env.example .env.local
npm install
```

**Free API key (recommended — no OpenAI needed)**

1. Open [Google AI Studio](https://aistudio.google.com/apikey) → create an API key.  
2. Put it in `.env.local`:

```bash
GOOGLE_GENERATIVE_AI_API_KEY=your-key-here
ODOO_MODE=mock
```

Or use [Groq](https://console.groq.com/keys) with `GROQ_API_KEY=...` instead.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

1. Pick a sample HR case  
2. Generate / revise a draft  
3. **Approve & write to Odoo** → creates `data/mock-writes.json`  
4. Discard never touches the system of record  

### Live Odoo (optional)

Each sample case is seeded as a Contact (`res.partner`) with `ref` = case id. Approved drafts become internal notes on that record.

```bash
# Start Docker Desktop first
npm run odoo:bootstrap
```

Then in `.env.local`:

```bash
ODOO_MODE=live
ODOO_URL=http://localhost:8069
ODOO_DB=hr_hitl_demo
ODOO_USERNAME=admin
ODOO_PASSWORD=admin
```

Restart `npm run dev`. Vercel cloud cannot reach `localhost` Odoo — use mock there, or a reachable staging Odoo.

Manual path: `docker compose up -d` → create DB `hr_hitl_demo` → `npm run odoo:seed`.

## What this demonstrates

| Signal | Where |
|---|---|
| Vercel AI SDK | `app/api/chat/route.ts`, `useChat` UI |
| HITL / guardrails | Write API requires `approved: true` |
| Eval mindset | `lib/eval.ts` |
| System of record | `lib/odoo.ts` + Docker Compose |
| CI / containers | `.github/workflows/ci.yml`, `Dockerfile`, `k8s/` |

## Scripts

```bash
npm run dev
npm run build
npm run typecheck
npm run eval:check
```

## License

MIT — fork and adapt freely.
