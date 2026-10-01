# Photo Log

## The problem

When something goes wrong in the warehouse or on a quality check, people take photos — then lose them in chat, email, or a phone gallery. Later nobody can prove what was seen, when, or on which record.

**What this showcase shows:** operational photo capture (e.g. from barcode or quality flows) with secure attachment storage and a clear chatter / audit trail.

## Who it helps

- Warehouse / quality operators who need evidence on the record  
- Engineers wiring photo upload into an ERP  
- Portfolio readers evaluating the pattern safely  

## How to run

This folder is a **read-and-learn showcase**. For a click-through UI, also open the [Interactive Demo Site](../site/).

1. Read [`demo_page.md`](./demo_page.md).  
2. Skim:
   - [`sample_upload_controller.py`](./sample_upload_controller.py)  
   - [`sample_audit_context.py`](./sample_audit_context.py)  
   - [`sample_client_payload.py`](./sample_client_payload.py)  

Samples avoid private hosts, customer ids, and secrets. Source mapping: `odoo_dev/mv_photo_log/controllers/photo_log.py`.
