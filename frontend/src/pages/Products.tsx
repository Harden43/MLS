import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, categoriesApi, suppliersApi, reportsApi } from '../services/api';
import type { Product, Category, Supplier } from '../types/index';
import { Plus, Pencil, Trash2, X, Search, ChevronUp, ChevronDown } from 'lucide-react';

type SortField = 'name' | 'sku' | 'stock' | 'price' | 'reorderPoint';
type SortOrder = 'asc' | 'desc';

export function Products() {
  // Fetch average daily usage (move hook inside component)
  const { data: usageData } = useQuery({
    queryKey: ['usage'],
    queryFn: reportsApi.getUsage,
  });

  // Map productId to avgDailyUsage
  const usageMap: Record<number, number> = {};
  if (Array.isArray(usageData?.data)) {
    for (const u of usageData.data) {
      usageMap[u.productId] = u.avgDailyUsage;
    }
  }
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out' | 'ok'>('all');
  const [categoryFilter, setCategoryFilter] = useState<number | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    stock: 0,
    price: 0,
    cost: 0,
    reorderPoint: 10,
    minStock: 5,
    maxStock: 100,
    unit: 'pcs',
    categoryId: null as number | null,
    supplierId: null as number | null,
    description: ''
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getAll,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: suppliersApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const productsList = Array.isArray(products?.data) ? products.data : [];
  const categoriesList = Array.isArray(categories?.data) ? categories.data : [];
  const suppliersList = Array.isArray(suppliers?.data) ? suppliers.data : [];

  const filteredProducts = useMemo(() => {
    let result = [...productsList];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter((p: Product) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.sku.toLowerCase().includes(searchLower) ||
        p.barcode?.toLowerCase().includes(searchLower)
      );
    }

    // Stock filter
    if (stockFilter !== 'all') {
      result = result.filter((p: Product) => {
        if (stockFilter === 'out') return p.stock === 0;
        if (stockFilter === 'low') return p.stock > 0 && p.stock <= p.reorderPoint;
        if (stockFilter === 'ok') return p.stock > p.reorderPoint;
        return true;
      });
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter((p: Product) => p.categoryId === categoryFilter);
    }

    // Sort
    result.sort((a: Product, b: Product) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [productsList, search, stockFilter, categoryFilter, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const generateSKU = () => {
    const prefix = formData.name.slice(0, 3).toUpperCase() || 'PRD';
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    setFormData({ ...formData, sku: `${prefix}-${random}` });
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        sku: product.sku,
        barcode: product.barcode || '',
        stock: product.stock,
        price: product.price,
        cost: product.cost || 0,
        reorderPoint: product.reorderPoint || 10,
        minStock: product.minStock || 5,
        maxStock: product.maxStock || 100,
        unit: product.unit || 'pcs',
        categoryId: product.categoryId || null,
        supplierId: product.supplierId || null,
        description: product.description || ''
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '', sku: '', barcode: '', stock: 0, price: 0, cost: 0,
        reorderPoint: 10, minStock: 5, maxStock: 100, unit: 'pcs',
        categoryId: null, supplierId: null, description: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      categoryId: formData.categoryId || undefined,
      supplierId: formData.supplierId || undefined,
      barcode: formData.barcode || undefined
    };
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.stock === 0) return { label: 'Out', class: 'bg-red-600 text-white' };
    if (product.stock <= product.reorderPoint) return { label: 'Low', class: 'bg-yellow-500 text-white' };
    return { label: 'OK', class: 'bg-green-600 text-white' };
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Products</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded shadow mb-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by name, SKU, or barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="border rounded px-3 py-2"
          >
            <option value="all">All Stock</option>
            <option value="ok">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
          <select
            value={categoryFilter === 'all' ? 'all' : categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="border rounded px-3 py-2"
          >
            <option value="all">All Categories</option>
            {categoriesList.map((c: Category) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          Showing {filteredProducts.length} of {productsList.length} products
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-4 py-3 text-left cursor-pointer hover:bg-gray-200" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-1">Product <SortIcon field="name" /></div>
              </th>
              <th className="px-4 py-3 text-left cursor-pointer hover:bg-gray-200" onClick={() => handleSort('sku')}>
                <div className="flex items-center gap-1">SKU <SortIcon field="sku" /></div>
              </th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Supplier</th>
              <th className="px-4 py-3 text-right">Avg Daily Usage</th>
              <th className="px-4 py-3 text-right">Reorder Advice</th>
              <th className="px-4 py-3 text-right cursor-pointer hover:bg-gray-200" onClick={() => handleSort('stock')}>
                <div className="flex items-center gap-1 justify-end">Stock <SortIcon field="stock" /></div>
              </th>
              <th className="px-4 py-3 text-right cursor-pointer hover:bg-gray-200" onClick={() => handleSort('reorderPoint')}>
                <div className="flex items-center gap-1 justify-end">Reorder Pt <SortIcon field="reorderPoint" /></div>
              </th>
              <th className="px-4 py-3 text-right cursor-pointer hover:bg-gray-200" onClick={() => handleSort('price')}>
                <div className="flex items-center gap-1 justify-end">Price <SortIcon field="price" /></div>
              </th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredProducts.map((product: Product) => {
              const status = getStockStatus(product);
              return (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{product.name}</td>
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">{product.sku}</td>
                  <td className="px-4 py-3 text-gray-600">{product.category?.name || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{product.supplier?.name || '-'}</td>
                  <td className="px-4 py-3 text-right text-blue-700 font-semibold">
                    {usageMap[product.id] !== undefined ? usageMap[product.id] : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {(() => {
                      // Actionable reorder advice logic
                      const avgDaily = usageMap[product.id];
                      const leadTime = product.supplier?.leadTimeDays ?? 7;
                      const reorderPoint = product.reorderPoint;
                      const stock = product.stock;
                      if (avgDaily === undefined || avgDaily === 0) return <span className="text-gray-400">-</span>;
                      // Calculate days until stockout
                      const _daysLeft = avgDaily > 0 ? Math.floor(stock / avgDaily) : null;
                      void _daysLeft; // Used for future display
                      // Calculate recommended reorder quantity (to cover lead time + safety)
                      const recommendedQty = Math.max(0, Math.ceil((leadTime * avgDaily + reorderPoint) - stock));
                      // Next order date (when stock will hit reorder point)
                      const daysToReorder = avgDaily > 0 ? Math.max(0, Math.ceil((stock - reorderPoint) / avgDaily)) : null;
                      const nextOrderDate = daysToReorder !== null ? new Date(Date.now() + daysToReorder * 24 * 60 * 60 * 1000) : null;
                      return (
                        <div className="flex flex-col items-end text-xs">
                          <span className="font-semibold text-blue-700">{recommendedQty > 0 ? `Order ${recommendedQty}` : 'No action'}</span>
                          {nextOrderDate && recommendedQty > 0 && (
                            <span className="text-gray-500">by {nextOrderDate.toLocaleDateString()}</span>
                          )}
                          {recommendedQty === 0 && <span className="text-green-600">Stock sufficient</span>}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{product.stock} {product.unit}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{product.reorderPoint}</td>
                  <td className="px-4 py-3 text-right font-medium">${product.price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${status.class}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openModal(product)} className="text-blue-600 hover:text-blue-800 mr-2">
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this product?')) deleteMutation.mutate(product.id);
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  {search || stockFilter !== 'all' || categoryFilter !== 'all'
                    ? 'No products match your filters'
                    : 'No products yet. Click "Add Product" to create one.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="text-lg font-bold">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={closeModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Product Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">SKU *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="flex-1 border rounded px-3 py-2 font-mono"
                      required
                    />
                    <button type="button" onClick={generateSKU} className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm">
                      Generate
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Barcode</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full border rounded px-3 py-2 font-mono"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={formData.categoryId || ''}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">No Category</option>
                    {categoriesList.map((c: Category) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Supplier</label>
                  <select
                    value={formData.supplierId || ''}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">No Supplier</option>
                    {suppliersList.map((s: Supplier) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cost Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Selling Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Current Stock</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="pcs">Pieces</option>
                    <option value="kg">Kilograms</option>
                    <option value="lbs">Pounds</option>
                    <option value="boxes">Boxes</option>
                    <option value="cases">Cases</option>
                    <option value="units">Units</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Reorder Point</label>
                  <input
                    type="number"
                    value={formData.reorderPoint}
                    onChange={(e) => setFormData({ ...formData, reorderPoint: parseInt(e.target.value) || 0 })}
                    className="w-full border rounded px-3 py-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">Alert when stock falls below this</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Min Stock</label>
                  <input
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Stock</label>
                  <input
                    type="number"
                    value={formData.maxStock}
                    onChange={(e) => setFormData({ ...formData, maxStock: parseInt(e.target.value) || 0 })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-6 pt-4 border-t">
                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  {editingProduct ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
