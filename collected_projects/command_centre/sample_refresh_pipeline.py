"""
Sanitised Command Centre refresh pipeline sample.

Captures the pattern:
- clear projection table
- read source orders
- map each order into a board entry
"""

from dataclasses import dataclass


@dataclass
class Order:
    id: int
    name: str
    state: str
    customer: str


def compute_entry(order: Order) -> dict:
    # Real implementation derives stage from multiple logistics/quality signals.
    stage = "in_production" if order.state not in {"done", "cancel"} else "delivered_no_issues"
    return {"name": order.name, "sale_order_id": order.id, "stage": stage, "customer_name": order.customer}


def refresh_entries(source_orders: list[Order]) -> list[dict]:
    active_orders = [o for o in source_orders if o.state != "cancel"]
    return [compute_entry(order) for order in active_orders]

