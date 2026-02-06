from marshmallow import Schema, fields, validate

class SupplierSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    contact = fields.Str(load_default="")
    email = fields.Email(load_default=None)
    phone = fields.Str(load_default=None)
    is_deleted = fields.Bool(dump_only=True)
