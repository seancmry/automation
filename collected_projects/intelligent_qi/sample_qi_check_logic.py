"""
Intelligent QI showcase sample.

Adapted from mv_intelligent_qi check logic to show:
- NC severity handling
- checklist completion gates
- analysed positions aggregation
- SCAR export trigger behaviour
"""

from dataclasses import dataclass, field


@dataclass
class QICheck:
    reports_required: bool = False
    nc_flagged: bool = False
    nc_type: str | None = None  # "major" | "minor"
    liability: str | None = None  # "makerverse" | "customer" | "supplier"
    customer_complaint: bool = False
    ch_status: str = "pending"
    cm_status: str = "pending"
    cp_status: str = "pending"
    cc_status: str = "pending"
    cr_status: str = "pending"
    ch_note: str = ""
    cm_note: str = ""
    cp_note: str = ""
    cc_note: str = ""
    cr_note: str = ""
    checks_in_plan: list[tuple[str, str]] = field(default_factory=list)  # (product, source)

    def checklist_codes(self) -> list[str]:
        codes = ["ch", "cm", "cp", "cc"]
        if self.reports_required:
            codes.append("cr")
        return codes

    def mandatory_steps_complete(self) -> bool:
        for code in self.checklist_codes():
            status = getattr(self, f"{code}_status")
            note = (getattr(self, f"{code}_note") or "").strip()
            if status == "pending":
                return False
            if status == "fail" and not note:
                return False
        return True

    def analysed_positions_text(self) -> str:
        if not self.checks_in_plan:
            return "-"
        lines = []
        for idx, (product, source) in enumerate(self.checks_in_plan, start=1):
            lines.append(f"{idx}. {product} ({source})")
        return "\n".join(lines)

    def flag_nc(self, severity: str) -> None:
        if severity not in {"major", "minor"}:
            raise ValueError("severity must be major or minor")
        self.nc_flagged = True
        self.nc_type = severity

    def can_export_scar(self) -> bool:
        return self.nc_flagged


if __name__ == "__main__":
    check = QICheck(reports_required=True, checks_in_plan=[("Bracket A", "SO line 10"), ("Shaft B", "Stock move 2201")])
    check.ch_status = check.cm_status = check.cp_status = check.cc_status = check.cr_status = "pass"
    check.flag_nc("major")
    print("Checklist complete:", check.mandatory_steps_complete())
    print("Can export SCAR:", check.can_export_scar())
    print(check.analysed_positions_text())
