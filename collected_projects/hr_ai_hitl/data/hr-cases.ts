/**
 * HR demo cases — shared by UI (prompts.ts) and Odoo seed script.
 */
export type HrCaseStatus = "open" | "in_review" | "pending_hrbp" | "closed";
export type HrCasePriority = "normal" | "high" | "urgent";

export type HrCaseRecord = {
  id: string;
  title: string;
  /** Display name shown in Odoo contact name */
  employeeName: string;
  /** Subtitle for workbench / legacy display */
  employee: string;
  context: string;
  department: string;
  manager: string;
  site: string;
  email: string;
  phone: string;
  status: HrCaseStatus;
  priority: HrCasePriority;
  openedOn: string;
};

export const HR_CASES: HrCaseRecord[] = [
  {
    id: "leave-overlap",
    title: "Parental leave + shift coverage",
    employeeName: "Alex M.",
    employee: "Alex M. (Production Tech, Line B)",
    department: "Production",
    manager: "T. Schneider (Line B Lead)",
    site: "Berlin Plant - Line B",
    email: "alex.m@demo.hr.local",
    phone: "+49 30 5550 4101",
    status: "pending_hrbp",
    priority: "high",
    openedOn: "2026-08-20",
    context: `Employee Alex M. requested parental leave starting 2026-09-15 for 8 weeks.
Team lead reports Line B already has two technicians on long-term sick leave.
Alex's contract is full-time at a high-volume production site.
Open: Is unpaid leave extension allowed after the statutory period; Is the temporary contractor requisition already approved; Is part-time return for two weeks possible.`,
  },
  {
    id: "policy-question",
    title: "Remote work exception request",
    employeeName: "Sam K.",
    employee: "Sam K. (People Analytics)",
    department: "People Analytics",
    manager: "L. Weber (HR Analytics Lead)",
    site: "Berlin Plant - Office",
    email: "sam.k@demo.hr.local",
    phone: "+49 30 5550 4188",
    status: "in_review",
    priority: "normal",
    openedOn: "2026-08-22",
    context: `Sam K. requested 3 days/week remote for 3 months to support eldercare.
Role is hybrid by policy (minimum 3 days on-site for People Analytics).
Manager is supportive if dashboards/SLA coverage stays intact.
Open: Does a temporary hybrid exception fit policy; What check-in cadence does HRBP require; Is eldercare documentation required.
No medical documentation attached yet.`,
  },
  {
    id: "equipment",
    title: "Ergonomic equipment escalation",
    employeeName: "Jordan P.",
    employee: "Jordan P. (Warehouse)",
    department: "Logistics / Warehouse",
    manager: "R. Costa (Shift Supervisor)",
    site: "Berlin Plant - Warehouse",
    email: "jordan.p@demo.hr.local",
    phone: "+49 30 5550 4203",
    status: "open",
    priority: "urgent",
    openedOn: "2026-08-17",
    context: `Jordan P. reported recurring wrist pain; occupational health recommended an alternate scanner grip and anti-fatigue mat.
Facilities ticket # ops-4421 is open for 11 days with no update.
Union steward asked for status. Safety wants confirmation equipment was issued before next shift block.
Open: Will equipment ship before the next shift block; Who owns follow-up on facilities ticket ops-4421.`,
  },
];

/** Extra contacts seeded for realism (managers, HRBP). */
export const HR_DEMO_STAFF = [
  {
    name: "M. Weber (HRBP Demo)",
    email: "m.weber@demo.hr.local",
    function: "HR Business Partner",
    ref: "staff-hrbp",
  },
  {
    name: "T. Schneider",
    email: "t.schneider@demo.hr.local",
    function: "Production Line Lead",
    ref: "staff-manager-line-b",
  },
];
