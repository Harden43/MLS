from marshmallow import Schema, fields, validate

class UnitSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=1, max=32))
    conversion_factor = fields.Float(load_default=1.0)  # To base unit
    base_unit_id = fields.Int(load_default=None)
