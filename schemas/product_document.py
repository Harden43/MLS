from marshmallow import Schema, fields, validate

class ProductDocumentSchema(Schema):
    id = fields.Int(dump_only=True)
    product_id = fields.Int(required=True)
    file_url = fields.Str(required=True)
    doc_type = fields.Str(validate=validate.OneOf(["image", "spec", "manual", "msds"]), required=True)
