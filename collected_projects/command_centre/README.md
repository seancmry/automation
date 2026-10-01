# Command Centre Showcase

## What This Demonstrates

A dynamic operations board that normalises Sales + Picking signals into actionable stage columns.

## Included Files

- [`demo_page.md`](./demo_page.md) - GitHub-friendly walkthrough.
- [`sample_stage_engine.py`](./sample_stage_engine.py) - Curated stage-routing logic.
- [`sample_refresh_pipeline.py`](./sample_refresh_pipeline.py) - Board refresh and projection pattern.
- [`sample_kanban_layout.xml`](./sample_kanban_layout.xml) - Sanitised kanban card/view excerpt.

## Source Mapping

Source module: `odoo_dev/mv_command_centre/models/command_centre_entry.py`.

## Portfolio Safety

Samples are adapted to avoid exposing:
- business-specific customer/order data,
- private infrastructure references,
- environment-specific internals.
