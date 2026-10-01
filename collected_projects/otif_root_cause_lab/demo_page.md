# OTIF Root Cause Lab - Demo Page

## Problem It Solves

Teams can see an order is late, but not consistently why. Without root-cause clarity, recurring misses repeat across sprints.

## Root Cause Strategy (Simplified)

1. Evaluate promised vs actual milestone sequence.
2. Classify the primary cause into one bucket:
   - `supplier_delay`
   - `quality_hold`
   - `internal_processing_delay`
   - `handoff_logistics_delay`
   - `data_gap`
3. Optionally attach a secondary cause where signals overlap.
4. Publish cause split trend weekly for OTIF retrospectives.

## Why This Matters

- Replaces generic "late" labels with actionable causes.
- Supports supplier reviews and internal process corrections.
- Improves cross-team accountability by using shared categories.

## Technical Snapshot

The rule set can be assembled from existing expected dates, picking states, quality outcomes, and delivery progression already captured in current Odoo custom modules.
