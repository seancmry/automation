# Photo Log - Demo Page

## Problem It Solves

Shop-floor operators need quick evidence capture tied to the exact logistics or quality context, without manual attachment housekeeping.

## Core Flow

1. Client sends image payload (base64) with context (`picking_id` or `quality_check_id`).
2. Endpoint validates payload and size.
3. Image saved as `ir.attachment`.
4. Internal chatter note posted with optional move/product context.
5. Record now has auditable photo evidence.

## Why It Is Useful

- Faster incident documentation.
- Better root-cause traceability.
- No manual file linking in chatter.

## Technical Snapshot

See [`sample_upload_controller.py`](./sample_upload_controller.py).
