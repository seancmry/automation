# Kubernetes stubs (production reference)

Pre-wired manifests for a production hardening discussion — not required for the local demo.

| File | Purpose |
|------|---------|
| `deployment.yaml` | 2 replicas, health probes on `/api/odoo/health`, secrets via `envFrom` |
| `service.yaml` | ClusterIP → port 3000 |
| `configmap.yaml` | Non-secret Odoo URL |
| `secret.example.yaml` | Template for API keys / Odoo creds |

## Local sanity check (optional)

```bash
docker build -t hr-hitl-workbench:local .
kubectl apply -f k8s/configmap.yaml
# create secret from .env.local first, then:
# kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/deployment.yaml -f k8s/service.yaml
```

## One-liner

> These manifests show how the HITL workbench would run on Kubernetes with secrets, probes, and rolling deploys from GitHub Actions.
