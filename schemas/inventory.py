from marshmallow import Schema, fields, validate

class InventorySchema(Schema):
    id = fields.Int(dump_only=True)
    product_id = fields.Int(required=True)
    warehouse_id = fields.Int(required=True)
    bin_id = fields.Int(load_default=None)
    batch_id = fields.Int(load_default=None)
    serial_number = fields.Str(load_default=None)
    qty_on_hand = fields.Float(required=True)
    qty_reserved = fields.Float(load_default=0)
    qty_damaged = fields.Float(load_default=0)
    qty_in_transit = fields.Float(load_default=0)
    last_movement_id = fields.Int(load_default=None)
