# MTO Traceability Map Showcase

## What This Demonstrates

An end-to-end trace from Sales Order through linked Purchase Orders, pickings, and quality outcomes for make-to-order operations.

## Included Files

- [`demo_page.md`](./demo_page.md) - GitHub-friendly walkthrough.

## Source Mapping

Primary source modules:
- `odoo_dev/mv_sale_fields/models/sale_order.py`
- `odoo_dev/mv_purchase_fields/models/purchase_order.py`
- `odoo_dev/mv_command_centre/models/command_centre_entry.py`

## Portfolio Safety

Samples are adapted to avoid exposing:
- business-specific customer/order data,
- private infrastructure references,
- environment-specific internals.
