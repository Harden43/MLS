import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockTransfersApi, productsApi, locationsApi } from '../services/api';
import type { StockTransfer, Product, Location } from '../types/index';
import { Plus, X, ArrowRight, CheckCircle } from 'lucide-react';

export function StockTransfers() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    productId: 0,
    fromLocationId: 0,
    toLocationId: 0,
    quantity: 1,
    notes: ''
  });

  const { data: transfers, isLoading } = useQuery({
    queryKey: ['stock-transfers'],
    queryFn: stockTransfersApi.getAll
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getAll
  });

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: locationsApi.getAll
  });

  const createMutation = useMutation({
    mutationFn: stockTransfersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-transfers'] });
      setShowModal(false);
      resetForm();
    }
  });

  const completeMutation = useMutation({
    mutationFn: stockTransfersApi.complete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    }
  });

  const resetForm = () => {
    setFormData({
      productId: 0,
      fromLocationId: 0,
      toLocationId: 0,
      quantity: 1,
      notes: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.productId && formData.fromLocationId && formData.toLocationId && formData.quantity > 0) {
      createMutation.mutate(formData);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_transit: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const transfersList = Array.isArray(transfers?.data) ? transfers.data : [];
  const productsList = Array.isArray(products?.data) ? products.data : [];
  const locationsList = Array.isArray(locations?.data) ? locations.data : [];

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Stock Transfers</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          New Transfer
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 text-sm">Total Transfers</div>
          <div className="text-2xl font-bold">{transfersList.length}</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg shadow">
          <div className="text-yellow-600 text-sm">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">
            {transfersList.filter((t: StockTransfer) => t.status === 'pending').length}
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow">
          <div className="text-blue-600 text-sm">In Transit</div>
          <div className="text-2xl font-bold text-blue-600">
            {transfersList.filter((t: StockTransfer) => t.status === 'in_transit').length}
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow">
          <div className="text-green-600 text-sm">Completed</div>
          <div className="text-2xl font-bold text-green-600">
            {transfersList.filter((t: StockTransfer) => t.status === 'completed').length}
          </div>
        </div>
      </div>

      {/* Transfers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transfer #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transfersList.map((transfer: StockTransfer) => (
              <tr key={transfer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{transfer.transferNumber}</td>
                <td className="px-6 py-4">
                  <div className="font-medium">{transfer.product?.name}</div>
                  <div className="text-sm text-gray-500">{transfer.product?.sku}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{transfer.fromLocation?.name}</span>
                    <ArrowRight size={16} className="text-gray-400" />
                    <span className="text-sm">{transfer.toLocation?.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-medium">{transfer.quantity}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transfer.status)}`}>
                    {transfer.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  {new Date(transfer.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  {transfer.status === 'pending' && (
                    <button
                      onClick={() => completeMutation.mutate(transfer.id)}
                      className="flex items-center gap-1 text-green-600 hover:text-green-800"
                      title="Complete Transfer"
                    >
                      <CheckCircle size={18} />
                      <span className="text-sm">Complete</span>
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {transfersList.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No stock transfers found
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
              <h2 className="text-xl font-bold">New Stock Transfer</h2>
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
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">From Location *</label>
                  <select
                    value={formData.fromLocationId}
                    onChange={(e) => setFormData({ ...formData, fromLocationId: parseInt(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value={0}>Select Location</option>
                    {locationsList.filter((l: Location) => l.id !== formData.toLocationId).map((l: Location) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">To Location *</label>
                  <select
                    value={formData.toLocationId}
                    onChange={(e) => setFormData({ ...formData, toLocationId: parseInt(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value={0}>Select Location</option>
                    {locationsList.filter((l: Location) => l.id !== formData.fromLocationId).map((l: Location) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Quantity *</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full border rounded-lg px-3 py-2"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                  placeholder="Optional notes for this transfer..."
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
                  disabled={!formData.productId || !formData.fromLocationId || !formData.toLocationId}
                >
                  Create Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
