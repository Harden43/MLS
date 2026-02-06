from flask import Blueprint, request, jsonify
from supabase_client import supabase
from marshmallow import ValidationError
from schemas.inventory import InventorySchema
from schemas.stock_movement import StockMovementSchema
from auth import require_auth, require_role

inventory_bp = Blueprint('inventory', __name__)
inventory_schema = InventorySchema()
movement_schema = StockMovementSchema()

@inventory_bp.route('/', methods=['GET'])
@require_auth
def get_inventory():
    # Filters: product_id, warehouse_id, bin_id, batch_id, serial_number
    filters = request.args.to_dict()
    query = supabase.table('inventory').select('*')
    for k, v in filters.items():
        query = query.eq(k, v)
    resp = query.execute()
    return jsonify(resp.data or [])

@inventory_bp.route('/movements', methods=['GET'])
@require_auth
def get_movements():
    # Filters: product_id, warehouse_id, movement_type, date range
    filters = request.args.to_dict()
    query = supabase.table('stock_movements').select('*')
    for k, v in filters.items():
        query = query.eq(k, v)
    resp = query.execute()
    return jsonify(resp.data or [])

@inventory_bp.route('/move', methods=['POST'])
@require_auth
@require_role('admin', 'warehouse')
def create_movement():
    json_data = request.get_json()
    if not json_data:
        return jsonify({'error': 'No input data provided'}), 400
    try:
        movement = movement_schema.load(json_data)
    except ValidationError as err:
        return jsonify({'error': err.messages}), 422
    # Negative stock prevention
    if movement['movement_type'] in ['sale', 'transfer_out', 'damage', 'adjustment']:
        inv_resp = supabase.table('inventory').select('qty_on_hand').eq('product_id', movement['product_id']).eq('warehouse_id', movement['warehouse_id']).single().execute()
        inv = inv_resp.data
        if not inv or inv['qty_on_hand'] < movement['quantity']:
            return jsonify({'error': 'Insufficient stock'}), 400
    # Insert movement
    result = supabase.table('stock_movements').insert(movement).execute()
    # Update inventory (simplified, real logic should aggregate movements)
    # ...
    return jsonify(result.data[0]), 201
