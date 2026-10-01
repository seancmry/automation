# Command Centre

## The problem

Sales and warehouse signals live in different places. Ops people still ask: *where is this order, and what should happen next?* Without one board, that answer is tribal knowledge.

**What this showcase shows:** a dynamic operations board that turns sales + picking signals into clear stage columns so the next action is visible.

## Who it helps

- Ops / supply-chain people who live in order status  
- Engineers designing a kanban-style command board on an ERP  
- Portfolio readers who want the pattern without real customer data  

## How to run

This folder is a **read-and-learn showcase** (not a full app install).

1. Read [`demo_page.md`](./demo_page.md) for the walkthrough.  
2. Skim the samples for the routing and refresh ideas:
   - [`sample_stage_engine.py`](./sample_stage_engine.py)  
   - [`sample_refresh_pipeline.py`](./sample_refresh_pipeline.py)  
   - [`sample_kanban_layout.xml`](./sample_kanban_layout.xml)  

Samples are sanitised (no customer/order data, no private infra).

Source mapping (private tree): `odoo_dev/mv_command_centre/models/command_centre_entry.py`.
