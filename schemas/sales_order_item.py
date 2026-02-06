from marshmallow import Schema, fields

class SalesOrderItemSchema(Schema):
    id = fields.Int(dump_only=True)
    order_id = fields.Int(required=True)
    product_id = fields.Int(required=True)
    quantity = fields.Float(required=True)
    unit_price = fields.Float(required=True)
    picked = fields.Bool(load_default=False)
    packed = fields.Bool(load_default=False)
    shipped = fields.Bool(load_default=False)
    returned = fields.Bool(load_default=False)
    credit_note_id = fields.Int(load_default=None)
    notes = fields.Str(load_default=None)
