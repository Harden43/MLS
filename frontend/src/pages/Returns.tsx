import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { returnsApi, customersApi, salesOrdersApi, productsApi } from '../services/api';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Plus, Eye, Trash2, X, RotateCcw, CheckCircle, Package, XCircle } from 'lucide-react';

const STATUS_OPTIONS = ['all', 'pending', 'approved', 'received', 'rejected', 'refunded'] as const;

const NEXT_STATUS_ACTIONS: Record<string, { label: string; status: string; icon: any; color: string }[]> = {
  pending: [
    { label: 'Approve', status: 'approved', icon: CheckCircle, color: 'text-green-600 hover:text-green-800' },
    { label: 'Reject', status: 'rejected', icon: XCircle, color: 'text-red-600 hover:text-red-800' },
  ],
  approved: [
    { label: 'Receive', status: 'received', icon: Package, color: 'text-blue-600 hover:text-blue-800' },
  ],
  received: [
    { label: 'Refund', status: 'refunded', icon: CheckCircle, color: 'text-purple-600 hover:text-purple-800' },
  ],
};

export function Returns() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [formData, setFormData] = useState({
    customerId: 0,
    salesOrderId: 0,
    reason: '',
    notes: '',
    items: [{ productId: 0, quantity: 1, unitPrice: 0 }],
  });

  const { data: returns, isLoading } = useQuery({
    queryKey: ['returns', statusFilter],
    queryFn: () => returnsApi.getAll(statusFilter !== 'all' ? { status: statusFilter } : undefined),
  });

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.getAll(),
  });

  const { data: salesOrders } = useQuery({
    queryKey: ['sales-orders'],
    queryFn: () => salesOrdersApi.getAll(),
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: returnsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      setShowCreateModal(false);
      resetForm();
      toast.success('Return created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create return');
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      returnsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      toast.success('Return status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update return status');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => returnsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      setDeleteTarget(null);
      toast.success('Return deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete return');
    },
  });

  const resetForm = () => {
    setFormData({
      customerId: 0,
      salesOrderId: 0,
      reason: '',
      notes: '',
      items: [{ productId: 0, quantity: 1, unitPrice: 0 }],
    });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: 0, quantity: 1, unitPrice: 0 }],
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index: number, field: string, value: number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.customerId && formData.items.every((i) => i.productId && i.quantity > 0)) {
      createMutation.mutate({
        ...formData,
        salesOrderId: formData.salesOrderId || undefined,
      });
    }
  };

  const customersList = Array.isArray(customers?.data) ? customers.data : [];
  const salesOrdersList = Array.isArray(salesOrders?.data) ? salesOrders.data : [];
  const productsList = Array.isArray(products?.data) ? products.data : [];
  const returnsList = Array.isArray(returns?.data) ? returns.data : [];

  if (isLoading) {
    return <LoadingSpinner fullPage message="Loading returns..." />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Returns</h1>
        <div className="flex items-center gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            Create Return
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {returnsList.length === 0 ? (
          <EmptyState
            icon={RotateCcw}
            title="No returns found"
            description="Create a return when a customer needs to send items back."
            action={{ label: 'Create Return', onClick: () => setShowCreateModal(true) }}
          />
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Return #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {returnsList.map((ret: any) => (
                <tr key={ret.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{ret.returnNumber}</td>
                  <td className="px-6 py-4">{ret.customer?.name || 'N/A'}</td>
                  <td className="px-6 py-4 text-gray-600">{ret.salesOrder?.orderNumber || '-'}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={ret.status} />
                  </td>
                  <td className="px-6 py-4">{new Date(ret.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">${Number(ret.total || 0).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setSelectedReturn(ret); setShowViewModal(true); }}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      {NEXT_STATUS_ACTIONS[ret.status]?.map((action) => {
                        const ActionIcon = action.icon;
                        return (
                          <button
                            key={action.status}
                            onClick={() => statusMutation.mutate({ id: ret.id, status: action.status })}
                            className={action.color}
                            title={action.label}
                          >
                            <ActionIcon size={18} />
                          </button>
                        );
                      })}
                      {ret.status === 'pending' && (
                        <button
                          onClick={() => setDeleteTarget(ret)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold">Create Return</h2>
              <button onClick={() => { setShowCreateModal(false); resetForm(); }}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Customer *</label>
                  <select
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: parseInt(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value={0}>Select Customer</option>
                    {customersList.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Related Sales Order</label>
                  <select
                    value={formData.salesOrderId}
                    onChange={(e) => setFormData({ ...formData, salesOrderId: parseInt(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value={0}>None</option>
                    {salesOrdersList.map((o: any) => (
                      <option key={o.id} value={o.id}>{o.orderNumber} - {o.customer?.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Reason *</label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g., Defective product, Wrong item shipped"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Return Items *</label>
                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <select
                      value={item.productId}
                      onChange={(e) => updateItem(index, 'productId', parseInt(e.target.value))}
                      className="flex-1 border rounded-lg px-3 py-2"
                      required
                    >
                      <option value={0}>Select Product</option>
                      {productsList.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                      className="w-20 border rounded-lg px-3 py-2"
                      min="1"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Unit Price"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-28 border rounded-lg px-3 py-2"
                      min="0"
                      step="0.01"
                      required
                    />
                    {formData.items.length > 1 && (
                      <button type="button" onClick={() => removeItem(index)} className="text-red-600">
                        <X size={20} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addItem} className="text-blue-600 text-sm mt-2">
                  + Add Item
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); resetForm(); }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold">Return {selectedReturn.returnNumber}</h2>
              <button onClick={() => setShowViewModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500">Customer:</span>
                  <p className="font-medium">{selectedReturn.customer?.name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <p className="mt-1"><StatusBadge status={selectedReturn.status} /></p>
                </div>
                <div>
                  <span className="text-gray-500">Sales Order:</span>
                  <p>{selectedReturn.salesOrder?.orderNumber || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Date:</span>
                  <p>{new Date(selectedReturn.createdAt).toLocaleDateString()}</p>
                </div>
                {selectedReturn.reason && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Reason:</span>
                    <p>{selectedReturn.reason}</p>
                  </div>
                )}
              </div>

              {selectedReturn.items && selectedReturn.items.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Items</h3>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Product</th>
                        <th className="px-3 py-2 text-right">Qty</th>
                        <th className="px-3 py-2 text-right">Price</th>
                        <th className="px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReturn.items.map((item: any) => (
                        <tr key={item.id} className="border-t">
                          <td className="px-3 py-2">{item.product?.name || 'N/A'}</td>
                          <td className="px-3 py-2 text-right">{item.quantity}</td>
                          <td className="px-3 py-2 text-right">${Number(item.unitPrice || 0).toFixed(2)}</td>
                          <td className="px-3 py-2 text-right">${Number(item.total || item.quantity * item.unitPrice || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedReturn.notes && (
                <div>
                  <span className="text-gray-500">Notes:</span>
                  <p>{selectedReturn.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        title="Delete Return"
        message={`Are you sure you want to delete return ${deleteTarget?.returnNumber}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
