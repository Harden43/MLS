
from flask import Blueprint, request, jsonify
from supabase_client import supabase
from marshmallow import ValidationError
from schemas.product import ProductSchema
from auth import require_auth, require_role

products_bp = Blueprint('products', __name__)
product_schema = ProductSchema()

@products_bp.route('/', methods=['GET'])
@require_auth
def list_products():
    try:
        resp = supabase.table('products').select('*').eq('is_deleted', False).execute()
        return jsonify(resp.data or [])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_bp.route('/', methods=['POST'])
@require_auth
@require_role('admin', 'purchasing')
def create_product():
    json_data = request.get_json()
    if not json_data:
        return jsonify({'error': 'No input data provided'}), 400
    try:
        data = product_schema.load(json_data)
    except ValidationError as err:
        return jsonify({'error': err.messages}), 422
    try:
        result = supabase.table('products').insert(data).execute()
        return jsonify(result.data[0]), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_bp.route('/<int:product_id>', methods=['GET'])
@require_auth
def get_product(product_id):
    try:
        resp = supabase.table('products').select('*').eq('id', product_id).eq('is_deleted', False).single().execute()
        if not resp.data:
            return jsonify({'error': 'Not found'}), 404
        return jsonify(resp.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_bp.route('/<int:product_id>', methods=['PUT'])
@require_auth
@require_role('admin', 'purchasing')
def update_product(product_id):
    json_data = request.get_json()
    if not json_data:
        return jsonify({'error': 'No input data provided'}), 400
    try:
        data = product_schema.load(json_data, partial=True)
    except ValidationError as err:
        return jsonify({'error': err.messages}), 422
    try:
        result = supabase.table('products').update(data).eq('id', product_id).execute()
        return jsonify(result.data[0])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_bp.route('/<int:product_id>', methods=['DELETE'])
@require_auth
@require_role('admin')
def delete_product(product_id):
    try:
        result = supabase.table('products').update({'is_deleted': True}).eq('id', product_id).execute()
        return jsonify({'deleted': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
