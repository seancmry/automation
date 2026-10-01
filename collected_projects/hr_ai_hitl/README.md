# HR AI HITL — Vercel AI SDK + Odoo

Small **portfolio / teaching** app for internal HR case notes:

- **Vercel AI SDK** streaming drafts (`ai` + `@ai-sdk/openai` + `@ai-sdk/react`)
- **Human-in-the-loop** approve before any system write
- **Odoo** write-back (mock by default; optional Docker live mode)
- Lightweight **eval heuristics** before write (demo of monitoring mindset)
- TypeScript / Next.js App Router

Odoo stands in for a real system of record (HRIS / ERP). Synthetic cases only — safe to demo and share.

```
HRBP UI (Next.js)
    → streamText (Vercel AI SDK)
    → human Approve / Discard
    → Odoo JSON-RPC  (or data/mock-writes.json)
```

## Quick start (mock Odoo — no Docker)

```bash
cd collected_projects/hr_ai_hitl   # or your clone path
cp .env.example .env.local
npm install
```

### Free API key (recommended — no OpenAI needed)

1. Open [Google AI Studio](https://aistudio.google.com/apikey) → create an API key (free).
2. Put it in `.env.local`:

```bash
GOOGLE_GENERATIVE_AI_API_KEY=your-key-here
ODOO_MODE=mock
```

Alternative free key: [Groq console](https://console.groq.com/keys) → set `GROQ_API_KEY=...` instead.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

1. Pick a sample HR case  
2. Generate / revise a draft  
3. **Approve & write to Odoo** → creates `data/mock-writes.json`  
4. Discard never touches the system of record  

## Live Odoo (self-hosted HR case records)

Each sample HR case is seeded as a **Contact** in Odoo (`res.partner`) with `ref` = case id. Approved drafts become **internal notes** on that employee record (visible in Odoo chatter).

### One-command bootstrap

```bash
# Start Docker Desktop first
npm run odoo:bootstrap
```

This will:
1. `docker compose up -d` (Postgres + Odoo 17 on :8069)
2. Create database `hr_hitl_demo` (first run)
3. Seed Alex / Sam / Jordan as contacts with case context in the Notes field
4. Write `data/odoo-case-map.json` for write routing

Then in `.env.local`:

```bash
ODOO_MODE=live
ODOO_URL=http://localhost:8069
ODOO_DB=hr_hitl_demo
ODOO_USERNAME=admin
ODOO_PASSWORD=admin
```

Restart `npm run dev`. The workbench loads case context from Odoo when live; approve writes a `mail.message` note on the matching contact.

### Manual steps

```bash
docker compose up -d
# First time: open http://localhost:8069 and create DB hr_hitl_demo (admin/admin)
npm run odoo:seed
```

In Odoo: **Contacts** → search `leave-overlap`, `policy-question`, or `equipment` (ref field). After approve in the app, open the contact → chatter shows the HR note.

> Vercel cloud deploy cannot reach `localhost` Odoo. Use mock mode on Vercel, or a publicly reachable staging Odoo / tunnel.

## What this demonstrates

| Signal | Where it shows up here |
|---|---|
| Vercel AI SDK | `app/api/chat/route.ts`, `useChat` UI |
| Production LLM product for non-engineers | HRBP case-note workbench |
| HITL / guardrails | Write API requires `approved: true`; no auto-write |
| Eval / monitoring mindset | `lib/eval.ts` + flags in UI / write path |
| Full-stack TS/React | Next.js App Router UI |
| System of record integration | `lib/odoo.ts` JSON-RPC + Docker Compose |
| Docker | `docker-compose.yml` for local Odoo + Postgres |
| GitHub Actions | `.github/workflows/ci.yml` (typecheck, eval, build, image) |
| Kubernetes | `k8s/` manifests + `Dockerfile` (prod discussion) |


## Talking points

- **Grounded drafts:** LLM output is tied to curated HRIS fields, not open-ended retrieval.
- **No silent writes:** approve is the only path to the system of record.
- **Eval is deliberate but light:** heuristic checks flag invented policy language — a start on an evaluation loop, not full LLMOps.
- **Production path:** point at `.github/workflows/ci.yml`, `Dockerfile`, and `k8s/` for hardening discussion.

## Scripts

```bash
npm run dev        # local
npm run build      # production build
npm run typecheck
npm run eval:check # golden-case eval (also runs in CI)
```

## License

MIT — feel free to fork and adapt for your portfolio.
