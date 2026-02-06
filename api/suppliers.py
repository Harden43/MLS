
from flask import Blueprint, request, jsonify
from supabase_client import supabase
from marshmallow import ValidationError
from schemas.supplier import SupplierSchema
from auth import require_auth, require_role

suppliers_bp = Blueprint('suppliers', __name__)
supplier_schema = SupplierSchema()

@suppliers_bp.route('/', methods=['GET'])
@require_auth
def list_suppliers():
    try:
        resp = supabase.table('suppliers').select('*').eq('is_deleted', False).execute()
        return jsonify(resp.data or [])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@suppliers_bp.route('/', methods=['POST'])
@require_auth
@require_role('admin', 'purchasing')
def create_supplier():
    json_data = request.get_json()
    if not json_data:
        return jsonify({'error': 'No input data provided'}), 400
    try:
        data = supplier_schema.load(json_data)
    except ValidationError as err:
        return jsonify({'error': err.messages}), 422
    try:
        result = supabase.table('suppliers').insert(data).execute()
        return jsonify(result.data[0]), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@suppliers_bp.route('/<int:supplier_id>', methods=['GET'])
@require_auth
def get_supplier(supplier_id):
    try:
        resp = supabase.table('suppliers').select('*').eq('id', supplier_id).eq('is_deleted', False).single().execute()
        if not resp.data:
            return jsonify({'error': 'Not found'}), 404
        return jsonify(resp.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@suppliers_bp.route('/<int:supplier_id>', methods=['PUT'])
@require_auth
@require_role('admin', 'purchasing')
def update_supplier(supplier_id):
    json_data = request.get_json()
    if not json_data:
        return jsonify({'error': 'No input data provided'}), 400
    try:
        data = supplier_schema.load(json_data, partial=True)
    except ValidationError as err:
        return jsonify({'error': err.messages}), 422
    try:
        result = supabase.table('suppliers').update(data).eq('id', supplier_id).execute()
        return jsonify(result.data[0])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@suppliers_bp.route('/<int:supplier_id>', methods=['DELETE'])
@require_auth
@require_role('admin')
def delete_supplier(supplier_id):
    try:
        result = supabase.table('suppliers').update({'is_deleted': True}).eq('id', supplier_id).execute()
        return jsonify({'deleted': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
