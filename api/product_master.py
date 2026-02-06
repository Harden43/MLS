from flask import Blueprint, request, jsonify
from supabase_client import supabase
from marshmallow import ValidationError
from schemas.product import ProductSchema
from schemas.product_variant import ProductVariantSchema
from schemas.category import CategorySchema
from schemas.unit import UnitSchema
from schemas.barcode import BarcodeSchema
from schemas.product_document import ProductDocumentSchema
from schemas.substitute_item import SubstituteItemSchema
from auth import require_auth, require_role

master_bp = Blueprint('product_master', __name__)
product_schema = ProductSchema()
variant_schema = ProductVariantSchema()
category_schema = CategorySchema()
unit_schema = UnitSchema()
barcode_schema = BarcodeSchema()
document_schema = ProductDocumentSchema()
substitute_schema = SubstituteItemSchema()

# Example: Create product with variants, categories, units, barcodes, documents, substitutes
@master_bp.route('/products', methods=['POST'])
@require_auth
@require_role('admin', 'purchasing')
def create_product_master():
    json_data = request.get_json()
    if not json_data:
        return jsonify({'error': 'No input data provided'}), 400
    try:
        product = product_schema.load(json_data.get('product', {}))
        variants = [variant_schema.load(v) for v in json_data.get('variants', [])]
        categories = [category_schema.load(c) for c in json_data.get('categories', [])]
        units = [unit_schema.load(u) for u in json_data.get('units', [])]
        barcodes = [barcode_schema.load(b) for b in json_data.get('barcodes', [])]
        documents = [document_schema.load(d) for d in json_data.get('documents', [])]
        substitutes = [substitute_schema.load(s) for s in json_data.get('substitutes', [])]
    except ValidationError as err:
        return jsonify({'error': err.messages}), 422
    # Insert product
    prod_result = supabase.table('products').insert(product).execute()
    prod_id = prod_result.data[0]['id']
    # Insert related data
    for v in variants:
        v['product_id'] = prod_id
        supabase.table('product_variants').insert(v).execute()
    for c in categories:
        supabase.table('product_categories').insert({'product_id': prod_id, 'category_id': c['id']}).execute()
    for u in units:
        supabase.table('product_units').insert({'product_id': prod_id, 'unit_id': u['id'], 'conversion_factor': u.get('conversion_factor', 1.0)}).execute()
    for b in barcodes:
        b['product_id'] = prod_id
        supabase.table('barcodes').insert(b).execute()
    for d in documents:
        d['product_id'] = prod_id
        supabase.table('product_documents').insert(d).execute()
    for s in substitutes:
        s['product_id'] = prod_id
        supabase.table('substitute_items').insert(s).execute()
    return jsonify({'id': prod_id, 'message': 'Product master created'}), 201
