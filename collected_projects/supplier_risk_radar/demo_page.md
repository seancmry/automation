# Supplier Risk Radar - Demo Page

## Problem It Solves

Operations and sourcing teams need a simple way to identify which suppliers are likely to create late deliveries, repeated non-conformities, or customer escalations.

## Core Scoring Model (Simplified)

1. Start from a neutral score baseline.
2. Add risk weight for delayed shipments and unstable lead times.
3. Add risk weight for quality outcomes (minor/major NC).
4. Add risk weight for complaint frequency.
5. Add a data-confidence penalty for missing tracking and sparse status signals.
6. Convert the final score into `low`, `medium`, `high`, or `critical`.

## Why This Matters

- Gives a weekly priority list for supplier follow-up.
- Prevents reactive firefighting near promised dates.
- Makes risk drivers transparent instead of subjective.

## Technical Snapshot

This concept can be sourced from existing SO/PO status, quality check outcomes, and complaint-linked signals already present in current modules.
