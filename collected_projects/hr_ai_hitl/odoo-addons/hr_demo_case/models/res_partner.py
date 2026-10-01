from odoo import fields, models


class ResPartner(models.Model):
    _inherit = "res.partner"

    x_hr_case_ref = fields.Char(string="Case ref", index=True, copy=False)
    x_hr_case_title = fields.Char(string="HR case title", copy=False)
    x_hr_case_status = fields.Selection(
        [
            ("open", "Open"),
            ("in_review", "In review"),
            ("pending_hrbp", "Pending HRBP"),
            ("closed", "Closed"),
        ],
        string="Case status",
        default="open",
        copy=False,
    )
    x_hr_case_priority = fields.Selection(
        [
            ("normal", "Normal"),
            ("high", "High"),
            ("urgent", "Urgent"),
        ],
        string="Priority",
        default="normal",
        copy=False,
    )
    x_hr_case_context = fields.Text(string="Case details", copy=False)
    x_hr_case_opened = fields.Date(string="Opened on", copy=False)
    x_hr_department = fields.Char(string="Department", copy=False)
    x_hr_manager = fields.Char(string="Reporting manager", copy=False)
    x_hr_site = fields.Char(string="Site", copy=False)
