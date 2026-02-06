from marshmallow import Schema, fields, validate

class SalesOrderSchema(Schema):
    id = fields.Int(dump_only=True)
    customer_id = fields.Int(required=True)
    status = fields.Str(validate=validate.OneOf([
        "draft", "confirmed", "picked", "packed", "shipped", "delivered", "returned", "cancelled"
    ]), required=True)
    created_by = fields.Int(required=True)
    shipment_tracking = fields.Str(load_default=None)
    delivery_confirmed = fields.Bool(load_default=False)
    notes = fields.Str(load_default=None)
