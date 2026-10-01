# Command Centre - Demo Page

## Problem It Solves

Ops teams need a single board showing where each order currently sits, with logic that blends supplier transit, warehouse flow, quality, NC, and delays.

## Current Stage Strategy (Simplified)

1. Non-conformity and complaints get highest priority.
2. Delivered if pipeline is done.
3. In Quality if QC step is active (ready/waiting).
4. Received if inbound done and downstream steps are still open.
5. In Transit only if supplier status is explicitly in transit.
6. Delayed if expected shipment is overdue and outbound is not done.
7. Otherwise In Production.

## Why This Matters

- Better operational triage.
- Fewer false positives in delayed and transit.
- Stage labels reflect real movement through the flow.

## Technical Snapshot

See [`sample_stage_engine.py`](./sample_stage_engine.py).
