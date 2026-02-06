from marshmallow import Schema, fields

class SubstituteItemSchema(Schema):
    id = fields.Int(dump_only=True)
    product_id = fields.Int(required=True)
    substitute_product_id = fields.Int(required=True)
    reason = fields.Str(load_default=None)
