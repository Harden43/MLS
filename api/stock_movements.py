from flask import Blueprint, request, jsonify
from supabase_client import supabase
from marshmallow import ValidationError
from schemas.stock_movement import StockMovementSchema
from auth import require_auth, require_role

movements_bp = Blueprint('stock_movements', __name__)
movement_schema = StockMovementSchema()

@movements_bp.route('/', methods=['POST'])
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
    # Validate movement type and business rules
    allowed_types = [
        'goods_receipt', 'goods_issue', 'transfer_in', 'transfer_out', 'adjustment',
        'customer_return', 'supplier_return', 'write_off', 'reversal'
    ]
    if movement['movement_type'] not in allowed_types:
        return jsonify({'error': 'Invalid movement type'}), 400
    # Approval required for reversal
    if movement['movement_type'] == 'reversal' and not movement.get('approved_by'):
        return jsonify({'error': 'Reversal requires approval'}), 403
    # Insert movement
    result = supabase.table('stock_movements').insert(movement).execute()
    # Update inventory (simplified)
    # ...
    return jsonify(result.data[0]), 201
