"""
Sanitised Intelligent QI selection engine sample.

Derived from historical mv_intelligent_qi engine concepts:
- candidate scoring
- rule matching
- dynamic sample-size targeting
"""

from dataclasses import dataclass
import math


@dataclass
class Rule:
    name: str
    technology: str = "other"
    feature_group: str = "any"
    require_uncommon_material: bool = False
    min_sample_percent: int = 10
    target_sample_percent: int = 20
    max_sample_percent: int = 40
    vip_min_percent: int = 30
    min_count: int = 1
    max_count: int = 0


def compute_target_count(total: int, rule: Rule, is_vip: bool = False) -> int:
    if total <= 0:
        return 0
    if total <= 10:
        base = max(1, math.ceil(total * 0.10))
    else:
        pct = max(rule.min_sample_percent, min(rule.target_sample_percent, rule.max_sample_percent)) / 100.0
        base = max(1, math.ceil(total * pct))
    if is_vip:
        base = max(base, math.ceil(total * (rule.vip_min_percent / 100.0)))
    base = max(base, rule.min_count)
    if rule.max_count:
        base = min(base, rule.max_count)
    return min(base, total)


def matches_rule(candidate: dict, rule: Rule) -> bool:
    if rule.technology != "other" and candidate["technology"] != rule.technology:
        return False
    if rule.feature_group not in ("any", candidate["feature_group"]):
        return False
    if rule.require_uncommon_material and not candidate["uncommon_material"]:
        return False
    return True

