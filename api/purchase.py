from flask import Blueprint, request, jsonify
from supabase_client import supabase
from marshmallow import ValidationError
from schemas.purchase_order import PurchaseOrderSchema
from schemas.purchase_order_item import PurchaseOrderItemSchema
from auth import require_auth, require_role

purchase_bp = Blueprint('purchase', __name__)
po_schema = PurchaseOrderSchema()
po_item_schema = PurchaseOrderItemSchema()

@purchase_bp.route('/orders', methods=['POST'])
@require_auth
@require_role('admin', 'purchasing')
def create_po():
    json_data = request.get_json()
    if not json_data:
        return jsonify({'error': 'No input data provided'}), 400
    try:
        po = po_schema.load(json_data.get('order', {}))
        items = [po_item_schema.load(i) for i in json_data.get('items', [])]
    except ValidationError as err:
        return jsonify({'error': err.messages}), 422
    po_result = supabase.table('purchase_orders').insert(po).execute()
    po_id = po_result.data[0]['id']
    for item in items:
        item['order_id'] = po_id
        supabase.table('purchase_order_items').insert(item).execute()
    return jsonify({'id': po_id, 'message': 'PO created'}), 201

@purchase_bp.route('/orders/<int:order_id>/receive', methods=['POST'])
@require_auth
@require_role('admin', 'warehouse')
def receive_po(order_id):
    json_data = request.get_json()
    received_items = json_data.get('items', [])
    for ritem in received_items:
        item_resp = supabase.table('purchase_order_items').select('*').eq('id', ritem['id']).single().execute()
        item = item_resp.data
        if not item:
            continue
        new_qty = item['received_quantity'] + ritem['received_quantity']
        over_receipt = new_qty > item['quantity']
        supabase.table('purchase_order_items').update({
            'received_quantity': new_qty,
            'over_receipt': over_receipt
        }).eq('id', item['id']).execute()
    supabase.table('purchase_orders').update({'status': 'received'}).eq('id', order_id).execute()
    return jsonify({'id': order_id, 'message': 'PO received'}), 200
