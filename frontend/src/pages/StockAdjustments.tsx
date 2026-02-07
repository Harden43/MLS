import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockAdjustmentsApi, productsApi } from '../services/api';
import type { StockAdjustment, Product } from '../types/index';
import { Plus, X, AlertTriangle, Package, ArrowUp, ArrowDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

const ADJUSTMENT_TYPES = [
  { value: 'correction', label: 'Stock Correction', icon: Package },
  { value: 'damage', label: 'Damaged Goods', icon: AlertTriangle },
  { value: 'write_off', label: 'Write Off', icon: X },
  { value: 'found', label: 'Found Stock', icon: ArrowUp },
  { value: 'return', label: 'Customer Return', icon: ArrowDown },
  { value: 'expiry', label: 'Expired', icon: AlertTriangle },
];

export function StockAdjustments() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    productId: 0,
    adjustmentType: 'correction',
    quantity: 0,
    reason: '',
    reference: ''
  });

  const { data: adjustments, isLoading } = useQuery({
    queryKey: ['stock-adjustments'],
    queryFn: stockAdjustmentsApi.getAll
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll()
  });

  const createMutation = useMutation({
    mutationFn: stockAdjustmentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-adjustments'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowModal(false);
      resetForm();
      toast.success('Stock adjustment created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create stock adjustment');
    },
  });

  const resetForm = () => {
    setFormData({
      productId: 0,
      adjustmentType: 'correction',
      quantity: 0,
      reason: '',
      reference: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.productId && formData.quantity !== 0) {
      createMutation.mutate(formData);
    }
  };

  const getTypeInfo = (type: string) => {
    return ADJUSTMENT_TYPES.find(t => t.value === type) || ADJUSTMENT_TYPES[0];
  };

  const adjustmentsList = Array.isArray(adjustments?.data) ? adjustments.data : [];
  const productsList = Array.isArray(products?.data) ? products.data : [];

  if (isLoading) {
    return <LoadingSpinner fullPage message="Loading stock adjustments..." />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Stock Adjustments</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          New Adjustment
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 text-sm">Total Adjustments</div>
          <div className="text-2xl font-bold">{adjustmentsList.length}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow">
          <div className="text-green-600 text-sm">Stock Added</div>
          <div className="text-2xl font-bold text-green-600">
            +{adjustmentsList.filter((a: StockAdjustment) => a.quantity > 0).reduce((sum: number, a: StockAdjustment) => sum + a.quantity, 0)}
          </div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow">
          <div className="text-red-600 text-sm">Stock Removed</div>
          <div className="text-2xl font-bold text-red-600">
            {adjustmentsList.filter((a: StockAdjustment) => a.quantity < 0).reduce((sum: number, a: StockAdjustment) => sum + a.quantity, 0)}
          </div>
        </div>
      </div>

      {/* Adjustments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {adjustmentsList.map((adjustment: StockAdjustment) => {
              const typeInfo = getTypeInfo(adjustment.adjustmentType);
              return (
                <tr key={adjustment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    {new Date(adjustment.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{adjustment.product?.name}</div>
                    <div className="text-sm text-gray-500">{adjustment.product?.sku}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100">
                      {typeInfo.label}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-right font-medium ${adjustment.quantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {adjustment.quantity >= 0 ? '+' : ''}{adjustment.quantity}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{adjustment.reason || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{adjustment.reference || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{(adjustment as any).user?.name || adjustment.userId || '-'}</td>
                </tr>
              );
            })}
            {adjustmentsList.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No stock adjustments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold">New Stock Adjustment</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product *</label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: parseInt(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                >
                  <option value={0}>Select Product</option>
                  {productsList.map((p: Product) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) - Current Stock: {p.stock}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Adjustment Type *</label>
                <select
                  value={formData.adjustmentType}
                  onChange={(e) => setFormData({ ...formData, adjustmentType: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                >
                  {ADJUSTMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Quantity *</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    {formData.quantity >= 0 ? '(Add to stock)' : '(Remove from stock)'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Use positive numbers to add stock, negative to remove
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Reason</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                  placeholder="Describe why this adjustment is being made..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Reference</label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g., Audit #123, RMA-456"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={!formData.productId || formData.quantity === 0}
                >
                  Create Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
