"""
Sanitised Photo Log audit context sample.

Mirrors the idea of building compact chatter context lines for
move/move-line/product traceability.
"""


def build_context_bits(move_name=None, move_line_id=None, row_id=None, product_name=None):
    bits = []
    if move_name:
        bits.append(f"Move: {move_name}")
    if move_line_id:
        bits.append(f"Move line: {move_line_id}")
    if row_id:
        bits.append(f"Row: {row_id}")
    if product_name:
        bits.append(f"Product: {product_name}")
    return bits


def compose_note(stage: str, bits: list[str]) -> str:
    suffix = f" | {' | '.join(bits)}" if bits else ""
    return f"Photo uploaded at stage '{stage}'{suffix}"

