"""
Photo Log showcase sample.

Adapted from mv_photo_log upload controller to show:
- payload validation
- target record resolution
- attachment + chatter posting
"""

import base64

MAX_BYTES = 10 * 1024 * 1024


def validate_image_payload(image_data_b64: str) -> bytes:
    if not image_data_b64:
        raise ValueError("No image data received.")
    try:
        raw = base64.b64decode(image_data_b64)
    except Exception as exc:
        raise ValueError("Invalid image data (base64 decode failed).") from exc
    if len(raw) > MAX_BYTES:
        raise ValueError("Image exceeds 10 MB.")
    return raw


def resolve_target(picking_id: int | None, quality_check_id: int | None) -> tuple[str, int]:
    if not picking_id and not quality_check_id:
        raise ValueError("Supply either picking_id or quality_check_id.")
    if picking_id:
        return ("stock.picking", picking_id)
    return ("quality.check", quality_check_id)


def build_chatter_note(stage: str, move_label: str | None = None, product_label: str | None = None) -> str:
    bits = []
    if move_label:
        bits.append(f"Move: {move_label}")
    if product_label:
        bits.append(f"Product: {product_label}")
    ctx = f" | {' | '.join(bits)}" if bits else ""
    return f"Photo uploaded at stage '{stage}'{ctx}"
