from marshmallow import Schema, fields, validate

class ProductSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    sku = fields.Str(required=True, validate=validate.Length(min=1, max=64))
    description = fields.Str(load_default="")
    is_deleted = fields.Bool(dump_only=True)
