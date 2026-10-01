"""
Sanitised Intelligent QI plan lifecycle sample.

Shows:
- plan state transitions
- plan/check count reporting
- source reference concept
"""

from dataclasses import dataclass, field


@dataclass
class Check:
    result: str = "pending"  # pending/pass/fail


@dataclass
class Plan:
    source_model: str = "manual"
    source_res_id: int = 0
    state: str = "draft"  # draft/running/done/cancel
    checks: list[Check] = field(default_factory=list)

    def source_ref(self) -> str | None:
        if self.source_model == "manual" or not self.source_res_id:
            return None
        return f"{self.source_model},{self.source_res_id}"

    def start(self) -> None:
        self.state = "running"

    def complete(self) -> None:
        self.state = "done"

    def cancel(self) -> None:
        self.state = "cancel"

    def stats(self) -> dict:
        failed = sum(1 for c in self.checks if c.result == "fail")
        return {"check_count": len(self.checks), "failed_count": failed}

