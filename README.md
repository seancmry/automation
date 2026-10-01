# Automation

## The problem

Ops and GTM teams need small systems that make work clearer — boards, quality checks, photo evidence, AI drafts with a human approve step. Production code often lives inside a private ERP. That is hard to show or learn from.

**What this repo does:** it collects **portfolio-safe** project folders: short READMEs, walkthrough pages, and sanitised code samples. You can browse how each idea works without needing the private system behind it.

## Who it helps

- Hiring managers and peers who want to see how Sean builds automation  
- Engineers learning HITL / ops patterns from small, readable examples  
- Anyone exploring the demos without MakerVerse credentials or live data  

## How to run

Start here:

1. Open [`collected_projects/README.md`](./collected_projects/README.md) for the project list.  
2. Pick a project folder → read its README (**problem / who / how to run**).  
3. Open `demo_page.md` in that folder for a longer walkthrough.  
4. Open any `sample_*.py` files for curated code snippets.

**Runnable end-to-end app:** [`collected_projects/hr_ai_hitl`](./collected_projects/hr_ai_hitl/) (Next.js; mock mode needs no Docker).

**Static browser demos:** open [`collected_projects/site`](./collected_projects/site/) (HTML/CSS/JS, no backend).

Most other folders are **showcases** (read + samples), not full installable products.

## Projects at a glance

| Project | One line |
| --- | --- |
| [HR AI HITL](./collected_projects/hr_ai_hitl/) | AI drafts an HR note; a person approves before anything is saved |
| [Photo Log](./collected_projects/photo_log/) | Capture operational photo evidence with a clear audit trail |
| [Intelligent QI](./collected_projects/intelligent_qi/) | Checklist quality checks and non-conformity handling |
| [Command Centre](./collected_projects/command_centre/) | Ops board that turns sales + picking signals into stages |
| [Supplier Risk Radar](./collected_projects/supplier_risk_radar/) | Rank suppliers from delivery / quality / complaint signals |
| [OTIF Root Cause Lab](./collected_projects/otif_root_cause_lab/) | Explain OTIF misses by root-cause category |
| [MTO Traceability Map](./collected_projects/mto_traceability_map/) | Trace make-to-order from sales order through quality |
| [Interactive Demo Site](./collected_projects/site/) | Static click-through demos for external viewers |

Samples are sanitised: no customer data, no private URLs, no secrets.
