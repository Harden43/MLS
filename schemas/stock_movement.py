from marshmallow import Schema, fields, validate

class StockMovementSchema(Schema):
    id = fields.Int(dump_only=True)
    product_id = fields.Int(required=True)
    warehouse_id = fields.Int(required=True)
    bin_id = fields.Int(load_default=None)
    movement_type = fields.Str(required=True, validate=validate.OneOf([
        "purchase", "sale", "transfer_in", "transfer_out", "adjustment", "return", "damage", "cycle_count"
    ]))
    quantity = fields.Float(required=True)
    ref_type = fields.Str(load_default=None)
    ref_id = fields.Int(load_default=None)
    notes = fields.Str(load_default=None)
    created_at = fields.DateTime(dump_only=True)
    user_id = fields.Int(load_default=None)
    batch_id = fields.Int(load_default=None)
    serial_number = fields.Str(load_default=None)
