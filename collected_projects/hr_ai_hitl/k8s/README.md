# Kubernetes stubs (production reference)

## The problem

A local `npm run dev` demo does not show how the same app would run in a cluster with secrets, health checks, and rolling deploys.

**What these files are:** pre-wired manifests for a production hardening *discussion* — not required to try the HITL demo on your laptop.

## Who it helps

- Engineers talking through “what would production look like?”  
- Readers of the parent [HR AI HITL README](../README.md) who want the k8s sketch  

## How to run

Optional local sanity check (cluster required):

```bash
docker build -t hr-hitl-workbench:local .
kubectl apply -f k8s/configmap.yaml
# create secret from .env.local first, then:
# kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/deployment.yaml -f k8s/service.yaml
```

| File | Purpose |
|------|---------|
| `deployment.yaml` | 2 replicas, health probes on `/api/odoo/health` |
| `service.yaml` | ClusterIP → port 3000 |
| `configmap.yaml` | Non-secret Odoo URL |
| `secret.example.yaml` | Template for API keys / Odoo creds |

For the actual teachable app, stay on the parent README’s mock / Docker paths.
