import pytest
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_list_products(client):
    resp = client.get('/api/v1/products/')
    assert resp.status_code == 200
    assert isinstance(resp.get_json(), list)

def test_create_product(client, monkeypatch):
    # Mock supabase insert
    def mock_insert(*args, **kwargs):
        class Result:
            data = [{'id': 1, 'name': 'Test Product', 'sku': 'SKU-001', 'is_deleted': False}]
        return Result()
    monkeypatch.setattr('api.products.supabase.table', lambda *a, **k: type('T', (), {'insert': lambda self, d: type('R', (), {'execute': lambda self: mock_insert()})()})())
    resp = client.post('/api/v1/products/', json={'name': 'Test Product', 'sku': 'SKU-001'})
    assert resp.status_code == 201
    assert resp.get_json()['name'] == 'Test Product'
