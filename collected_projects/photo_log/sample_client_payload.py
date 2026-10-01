"""
Sanitised example payload contract for photo upload clients.

This is framework-agnostic pseudo-client code to show how a
barcode/QC client would call the upload endpoint.
"""


def build_upload_payload(image_b64: str, *, stage: str, picking_id: int | None = None, quality_check_id: int | None = None):
    if not picking_id and not quality_check_id:
        raise ValueError("Either picking_id or quality_check_id is required.")
    return {
        "image_data": image_b64,
        "stage": stage,
        "picking_id": picking_id,
        "quality_check_id": quality_check_id,
        "filename": "evidence.jpg",
        "mimetype": "image/jpeg",
    }

