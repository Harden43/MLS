import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseOrdersApi, suppliersApi, productsApi } from '../services/api';
import type { PurchaseOrder, Supplier, Product } from '../types/index';
import { Plus, Eye, Truck, X, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function PurchaseOrders() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [formData, setFormData] = useState({
    supplierId: 0,
    expectedDate: '',
    notes: '',
    items: [{ productId: 0, quantity: 1, unitPrice: 0 }]
  });

  const { data: orders, isLoading } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: purchaseOrdersApi.getAll
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: suppliersApi.getAll
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getAll
  });

  const createMutation = useMutation({
    mutationFn: purchaseOrdersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      setShowCreateModal(false);
      resetForm();
      toast.success('Purchase order created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create purchase order');
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      purchaseOrdersApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Order status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update order status');
    },
  });

  const receiveMutation = useMutation({
    mutationFn: ({ id, items }: { id: number; items: { itemId: number; receivedQty: number }[] }) =>
      purchaseOrdersApi.receive(id, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowReceiveModal(false);
      toast.success('Goods received successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to receive goods');
    },
  });

  const resetForm = () => {
    setFormData({
      supplierId: 0,
      expectedDate: '',
      notes: '',
      items: [{ productId: 0, quantity: 1, unitPrice: 0 }]
    });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: 0, quantity: 1, unitPrice: 0 }]
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const updateItem = (index: number, field: string, value: number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.supplierId && formData.items.every(i => i.productId && i.quantity > 0)) {
      createMutation.mutate(formData);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      ordered: 'bg-purple-100 text-purple-800',
      partial: 'bg-orange-100 text-orange-800',
      received: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const suppliersList = Array.isArray(suppliers?.data) ? suppliers.data : [];
  const productsList = Array.isArray(products?.data) ? products.data : [];
  const ordersList = Array.isArray(orders?.data) ? orders.data : [];

  if (isLoading) {
    return <LoadingSpinner fullPage message="Loading purchase orders..." />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Purchase Orders</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Create PO
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {ordersList.map((order: PurchaseOrder) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{order.orderNumber}</td>
                <td className="px-6 py-4">{order.supplier?.name || 'N/A'}</td>
                <td className="px-6 py-4">{new Date(order.orderDate).toLocaleDateString()}</td>
                <td className="px-6 py-4">${order.total.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setSelectedOrder(order); setShowViewModal(true); }}
                      className="text-blue-600 hover:text-blue-800"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                    {(order.status === 'ordered' || order.status === 'partial') && (
                      <button
                        onClick={() => { setSelectedOrder(order); setShowReceiveModal(true); }}
                        className="text-green-600 hover:text-green-800"
                        title="Receive Goods"
                      >
                        <Truck size={18} />
                      </button>
                    )}
                    {order.status === 'draft' && (
                      <button
                        onClick={() => statusMutation.mutate({ id: order.id, status: 'pending' })}
                        className="text-yellow-600 hover:text-yellow-800"
                        title="Submit for Approval"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {ordersList.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No purchase orders found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold">Create Purchase Order</h2>
              <button onClick={() => { setShowCreateModal(false); resetForm(); }}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Supplier *</label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: parseInt(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value={0}>Select Supplier</option>
                    {suppliersList.map((s: Supplier) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Expected Date</label>
                  <input
                    type="date"
                    value={formData.expectedDate}
                    onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Items *</label>
                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <select
                      value={item.productId}
                      onChange={(e) => updateItem(index, 'productId', parseInt(e.target.value))}
                      className="flex-1 border rounded-lg px-3 py-2"
                      required
                    >
                      <option value={0}>Select Product</option>
                      {productsList.map((p: Product) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                      className="w-20 border rounded-lg px-3 py-2"
                      min="1"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value))}
                      className="w-24 border rounded-lg px-3 py-2"
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Order
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
                  <span className="text-gray-500">Supplier:</span>
                  <p className="font-medium">{selectedOrder.supplier?.name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <p><span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedOrder.status)}`}>{selectedOrder.status}</span></p>
                </div>
                <div>
                  <span className="text-gray-500">Order Date:</span>
                  <p>{new Date(selectedOrder.orderDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Expected Date:</span>
                  <p>{selectedOrder.expectedDate ? new Date(selectedOrder.expectedDate).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Items</h3>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Product</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                      <th className="px-3 py-2 text-right">Received</th>
                      <th className="px-3 py-2 text-right">Price</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="px-3 py-2">{item.product?.name}</td>
                        <td className="px-3 py-2 text-right">{item.quantity}</td>
                        <td className="px-3 py-2 text-right">{item.receivedQty}</td>
                        <td className="px-3 py-2 text-right">${item.unitPrice.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right">${item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t font-medium">
                    <tr>
                      <td colSpan={4} className="px-3 py-2 text-right">Subtotal:</td>
                      <td className="px-3 py-2 text-right">${selectedOrder.subtotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="px-3 py-2 text-right">Tax:</td>
                      <td className="px-3 py-2 text-right">${selectedOrder.tax.toFixed(2)}</td>
                    </tr>
                    <tr className="text-lg">
                      <td colSpan={4} className="px-3 py-2 text-right">Total:</td>
                      <td className="px-3 py-2 text-right">${selectedOrder.total.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

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

      {/* Receive Modal */}
      {showReceiveModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold">Receive Goods - {selectedOrder.orderNumber}</h2>
              <button onClick={() => setShowReceiveModal(false)}>
                <X size={24} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formEl = e.target as HTMLFormElement;
                const items = selectedOrder.items?.map((item) => ({
                  itemId: item.id,
                  receivedQty: parseInt((formEl.elements.namedItem(`qty-${item.id}`) as HTMLInputElement)?.value || '0')
                })).filter(i => i.receivedQty > 0) || [];
                if (items.length > 0) {
                  receiveMutation.mutate({ id: selectedOrder.id, items });
                }
              }}
              className="p-4 space-y-4"
            >
              {selectedOrder.items?.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="font-medium">{item.product?.name}</p>
                    <p className="text-sm text-gray-500">
                      Ordered: {item.quantity} | Already Received: {item.receivedQty}
                    </p>
                  </div>
                  <input
                    type="number"
                    name={`qty-${item.id}`}
                    placeholder="Receive Qty"
                    className="w-24 border rounded-lg px-3 py-2"
                    min="0"
                    max={item.quantity - item.receivedQty}
                    defaultValue={0}
                  />
                </div>
              ))}
              <div className="flex gap-2 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowReceiveModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Receive Items
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
