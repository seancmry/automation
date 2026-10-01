# MTO Traceability Map - Demo Page

## Problem It Solves

For MTO flows, teams lose time switching between Sales, Purchase, Stock, and Quality to understand one order's real status.

## Traceability Flow (Simplified)

1. Start at `sale.order`.
2. Resolve linked PO chain via order lines and fallback origin matching.
3. Collect related pickings across inbound/internal/outbound steps.
4. Overlay quality outcomes and complaint/NC flags.
5. Present one timeline with current bottleneck and next required action.

## Why This Matters

- Reduces manual triage per order.
- Makes broken links visible early.
- Gives customer-facing teams a reliable status narrative.

## Technical Snapshot

The map is grounded in existing helper patterns already used in current modules for linking SO -> PO -> pickings and deriving operational stages.
