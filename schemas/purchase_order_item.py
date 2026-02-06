from marshmallow import Schema, fields

class PurchaseOrderItemSchema(Schema):
    id = fields.Int(dump_only=True)
    order_id = fields.Int(required=True)
    product_id = fields.Int(required=True)
    quantity = fields.Float(required=True)
    unit_price = fields.Float(required=True)
    received_quantity = fields.Float(load_default=0)
    over_receipt = fields.Bool(load_default=False)
    notes = fields.Str(load_default=None)
