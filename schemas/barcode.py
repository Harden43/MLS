from marshmallow import Schema, fields, validate

class BarcodeSchema(Schema):
    id = fields.Int(dump_only=True)
    product_id = fields.Int(required=True)
    code = fields.Str(required=True)
    variant_id = fields.Int(load_default=None)
    type = fields.Str(validate=validate.OneOf(["EAN13", "UPC", "QR", "CODE128"]), load_default="EAN-13")
