import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesOrdersApi, customersApi, productsApi } from '../services/api';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Plus, Eye, Trash2, X, ShoppingCart, CheckCircle, Truck, Package, XCircle } from 'lucide-react';

const STATUS_OPTIONS = ['all', 'draft', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

const NEXT_STATUS_ACTIONS: Record<string, { label: string; status: string; icon: any; color: string }[]> = {
  draft: [
    { label: 'Confirm', status: 'confirmed', icon: CheckCircle, color: 'text-blue-600 hover:text-blue-800' },
    { label: 'Cancel', status: 'cancelled', icon: XCircle, color: 'text-red-600 hover:text-red-800' },
  ],
  confirmed: [
    { label: 'Process', status: 'processing', icon: Package, color: 'text-indigo-600 hover:text-indigo-800' },
    { label: 'Cancel', status: 'cancelled', icon: XCircle, color: 'text-red-600 hover:text-red-800' },
  ],
  processing: [
    { label: 'Ship', status: 'shipped', icon: Truck, color: 'text-purple-600 hover:text-purple-800' },
    { label: 'Cancel', status: 'cancelled', icon: XCircle, color: 'text-red-600 hover:text-red-800' },
  ],
  shipped: [
    { label: 'Deliver', status: 'delivered', icon: CheckCircle, color: 'text-green-600 hover:text-green-800' },
  ],
};

export function SalesOrders() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [formData, setFormData] = useState({
    customerId: 0,
    notes: '',
    items: [{ productId: 0, quantity: 1, unitPrice: 0 }],
  });

  const { data: orders, isLoading } = useQuery({
    queryKey: ['sales-orders', statusFilter],
    queryFn: () => salesOrdersApi.getAll(statusFilter !== 'all' ? { status: statusFilter } : undefined),
  });

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.getAll(),
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: salesOrdersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      setShowCreateModal(false);
      resetForm();
      toast.success('Sales order created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create sales order');
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      salesOrdersApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      toast.success('Order status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update order status');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => salesOrdersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      setDeleteTarget(null);
      toast.success('Sales order deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete sales order');
    },
  });

  const resetForm = () => {
    setFormData({
      customerId: 0,
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

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.customerId && formData.items.every((i) => i.productId && i.quantity > 0)) {
      createMutation.mutate(formData);
    }
  };

  const customersList = Array.isArray(customers?.data) ? customers.data : [];
  const productsList = Array.isArray(products?.data) ? products.data : [];
  const ordersList = Array.isArray(orders?.data) ? orders.data : [];

  if (isLoading) {
    return <LoadingSpinner fullPage message="Loading sales orders..." />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Sales Orders</h1>
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
            Create Order
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {ordersList.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="No sales orders found"
            description="Create your first sales order to get started."
            action={{ label: 'Create Order', onClick: () => setShowCreateModal(true) }}
          />
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {ordersList.map((order: any) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{order.orderNumber}</td>
                  <td className="px-6 py-4">{order.customer?.name || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-4">{new Date(order.orderDate || order.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">${Number(order.total || 0).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowViewModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      {NEXT_STATUS_ACTIONS[order.status]?.map((action) => {
                        const ActionIcon = action.icon;
                        return (
                          <button
                            key={action.status}
                            onClick={() => statusMutation.mutate({ id: order.id, status: action.status })}
                            className={action.color}
                            title={action.label}
                          >
                            <ActionIcon size={18} />
                          </button>
                        );
                      })}
                      {order.status === 'draft' && (
                        <button
                          onClick={() => setDeleteTarget(order)}
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
              <h2 className="text-xl font-bold">Create Sales Order</h2>
              <button onClick={() => { setShowCreateModal(false); resetForm(); }}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
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
                <label className="block text-sm font-medium mb-2">Line Items *</label>
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
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
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
                    <span className="flex items-center text-sm text-gray-500 w-24 justify-end">
                      ${(item.quantity * item.unitPrice).toFixed(2)}
                    </span>
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

              <div className="bg-gray-50 rounded-lg p-3 text-right">
                <span className="text-sm text-gray-500">Order Total: </span>
                <span className="text-lg font-bold text-gray-800">${calculateTotal().toFixed(2)}</span>
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
                  {createMutation.isPending ? 'Creating...' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold">Order {selectedOrder.orderNumber}</h2>
              <button onClick={() => setShowViewModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500">Customer:</span>
                  <p className="font-medium">{selectedOrder.customer?.name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <p className="mt-1"><StatusBadge status={selectedOrder.status} /></p>
                </div>
                <div>
                  <span className="text-gray-500">Order Date:</span>
                  <p>{new Date(selectedOrder.orderDate || selectedOrder.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Total:</span>
                  <p className="font-medium">${Number(selectedOrder.total || 0).toFixed(2)}</p>
                </div>
              </div>

              {selectedOrder.items && selectedOrder.items.length > 0 && (
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
                      {selectedOrder.items.map((item: any) => (
                        <tr key={item.id} className="border-t">
                          <td className="px-3 py-2">{item.product?.name || 'N/A'}</td>
                          <td className="px-3 py-2 text-right">{item.quantity}</td>
                          <td className="px-3 py-2 text-right">${Number(item.unitPrice || 0).toFixed(2)}</td>
                          <td className="px-3 py-2 text-right">${Number(item.total || item.quantity * item.unitPrice || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t font-medium">
                      <tr>
                        <td colSpan={3} className="px-3 py-2 text-right">Subtotal:</td>
                        <td className="px-3 py-2 text-right">${Number(selectedOrder.subtotal || 0).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="px-3 py-2 text-right">Tax:</td>
                        <td className="px-3 py-2 text-right">${Number(selectedOrder.tax || 0).toFixed(2)}</td>
                      </tr>
                      <tr className="text-lg">
                        <td colSpan={3} className="px-3 py-2 text-right">Total:</td>
                        <td className="px-3 py-2 text-right">${Number(selectedOrder.total || 0).toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {selectedOrder.notes && (
                <div>
                  <span className="text-gray-500">Notes:</span>
                  <p>{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        title="Delete Sales Order"
        message={`Are you sure you want to delete order ${deleteTarget?.orderNumber}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
