from flask import Blueprint, request, jsonify
from supabase_client import supabase
from marshmallow import ValidationError
from schemas.sales_order import SalesOrderSchema
from schemas.sales_order_item import SalesOrderItemSchema
from auth import require_auth, require_role

sales_bp = Blueprint('sales', __name__)
so_schema = SalesOrderSchema()
so_item_schema = SalesOrderItemSchema()

@sales_bp.route('/orders', methods=['POST'])
@require_auth
@require_role('admin', 'sales')
def create_so():
    json_data = request.get_json()
    if not json_data:
        return jsonify({'error': 'No input data provided'}), 400
    try:
        so = so_schema.load(json_data.get('order', {}))
        items = [so_item_schema.load(i) for i in json_data.get('items', [])]
    except ValidationError as err:
        return jsonify({'error': err.messages}), 422
    so_result = supabase.table('sales_orders').insert(so).execute()
    so_id = so_result.data[0]['id']
    for item in items:
        item['order_id'] = so_id
        supabase.table('sales_order_items').insert(item).execute()
    return jsonify({'id': so_id, 'message': 'SO created'}), 201

@sales_bp.route('/orders/<int:order_id>/ship', methods=['POST'])
@require_auth
@require_role('admin', 'warehouse')
def ship_so(order_id):
    json_data = request.get_json()
    shipped_items = json_data.get('items', [])
    for sitem in shipped_items:
        item_resp = supabase.table('sales_order_items').select('*').eq('id', sitem['id']).single().execute()
        item = item_resp.data
        if not item:
            continue
        supabase.table('sales_order_items').update({
            'shipped': True
        }).eq('id', item['id']).execute()
    supabase.table('sales_orders').update({'status': 'shipped'}).eq('id', order_id).execute()
    return jsonify({'id': order_id, 'message': 'SO shipped'}), 200

@sales_bp.route('/orders/<int:order_id>/return', methods=['POST'])
@require_auth
@require_role('admin', 'sales')
def return_so(order_id):
    json_data = request.get_json()
    returned_items = json_data.get('items', [])
    for ritem in returned_items:
        item_resp = supabase.table('sales_order_items').select('*').eq('id', ritem['id']).single().execute()
        item = item_resp.data
        if not item:
            continue
        supabase.table('sales_order_items').update({
            'returned': True
        }).eq('id', item['id']).execute()
    supabase.table('sales_orders').update({'status': 'returned'}).eq('id', order_id).execute()
    return jsonify({'id': order_id, 'message': 'SO returned'}), 200
