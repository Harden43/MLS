from marshmallow import Schema, fields, validate

class PurchaseOrderSchema(Schema):
    id = fields.Int(dump_only=True)
    supplier_id = fields.Int(required=True)
    status = fields.Str(validate=validate.OneOf([
        "draft", "ordered", "received", "cancelled", "returned"
    ]), required=True)
    expected_date = fields.Date(required=True)
    total = fields.Float(required=True)
    landed_cost = fields.Float(load_default=0)
    created_by = fields.Int(required=True)
    notes = fields.Str(load_default=None)
