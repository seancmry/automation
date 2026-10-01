"""
Command Centre showcase sample.

Adapted from mv_command_centre stage routing to demonstrate
how operational signals map to board columns.
"""

from dataclasses import dataclass


@dataclass
class OrderSignals:
    is_customer_complaint: bool = False
    is_non_conformity: bool = False
    pipeline_stage: str = "none"  # none, inbound, qc, store, outbound, done
    supplier_status: str = "not_shipped"  # not_shipped, in_transit, delivered
    has_quality_ready_or_waiting: bool = False
    has_done_inbound: bool = False
    has_open_post_receipt_steps: bool = False
    has_done_outbound: bool = False
    expected_shipment_overdue: bool = False


def compute_stage(sig: OrderSignals) -> str:
    if sig.is_customer_complaint:
        return "customer_complaint"
    if sig.is_non_conformity:
        return "non_conformity"
    if sig.pipeline_stage == "done":
        return "delivered_no_issues"
    if sig.has_quality_ready_or_waiting:
        return "in_quality_inspection"
    if sig.has_done_inbound and sig.has_open_post_receipt_steps:
        return "received"
    if sig.supplier_status == "in_transit":
        return "in_transit_mv"
    if sig.expected_shipment_overdue and not sig.has_done_outbound:
        return "delayed"
    return "in_production"


if __name__ == "__main__":
    demo = OrderSignals(supplier_status="in_transit")
    print(compute_stage(demo))
