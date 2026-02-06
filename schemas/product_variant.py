from marshmallow import Schema, fields, validate

class ProductVariantSchema(Schema):
    id = fields.Int(dump_only=True)
    product_id = fields.Int(required=True)
    attributes = fields.Dict(required=True)  # e.g. {"size": "M", "color": "Red"}
    sku = fields.Str(required=True, validate=validate.Length(min=1, max=64))
    barcode = fields.Str(load_default=None)
    status = fields.Str(validate=validate.OneOf(["active", "discontinued"]), load_default="active")
