import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliersApi } from '../services/api';
import type { Supplier } from '../types/index';
import { Plus, Pencil, Trash2, X, Search } from 'lucide-react';

export function Suppliers() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    contact: '',
    email: '',
    phone: '',
    address: '',
    paymentTerms: '',
    leadTimeDays: 7
  });

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: suppliersApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: suppliersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => suppliersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: suppliersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });

  const suppliersList = Array.isArray(suppliers?.data) ? suppliers.data : [];

  const filteredSuppliers = useMemo(() => {
    if (!search) return suppliersList;
    const searchLower = search.toLowerCase();
    return suppliersList.filter((s: Supplier) =>
      s.name.toLowerCase().includes(searchLower) ||
      s.code?.toLowerCase().includes(searchLower) ||
      s.email?.toLowerCase().includes(searchLower) ||
      s.contact?.toLowerCase().includes(searchLower)
    );
  }, [suppliersList, search]);

  const generateCode = () => {
    const prefix = formData.name.slice(0, 3).toUpperCase() || 'SUP';
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    setFormData({ ...formData, code: `${prefix}-${random}` });
  };

  const openModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        code: supplier.code || '',
        contact: supplier.contact || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        paymentTerms: supplier.paymentTerms || '',
        leadTimeDays: supplier.leadTimeDays || 7
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        name: '', code: '', contact: '', email: '', phone: '',
        address: '', paymentTerms: '', leadTimeDays: 7
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      code: formData.code || undefined
    };
    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Suppliers</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Supplier
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded shadow mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mt-2 text-sm text-gray-500">
          Showing {filteredSuppliers.length} of {suppliersList.length} suppliers
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Code</th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-right">Lead Time (days)</th>
              <th className="px-4 py-3 text-right">Products</th>
              <th className="px-4 py-3 text-right">POs</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredSuppliers.map((supplier: Supplier) => (
              <tr key={supplier.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{supplier.name}</td>
                <td className="px-4 py-3 text-gray-600 font-mono text-xs">{supplier.code || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{supplier.contact || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{supplier.email || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{supplier.phone || '-'}</td>
                <td className="px-4 py-3 text-right">{supplier.leadTimeDays}</td>
                <td className="px-4 py-3 text-right">{supplier._count?.products || 0}</td>
                <td className="px-4 py-3 text-right">{supplier._count?.purchaseOrders || 0}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openModal(supplier)} className="text-blue-600 hover:text-blue-800 mr-2">
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this supplier?')) deleteMutation.mutate(supplier.id);
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredSuppliers.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  {search ? 'No suppliers match your search' : 'No suppliers yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="text-lg font-bold">{editingSupplier ? 'Edit Supplier' : 'Add Supplier'}</h2>
              <button onClick={closeModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Supplier Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="flex-1 border rounded px-3 py-2 font-mono"
                      placeholder="e.g., SUP-001"
                    />
                    <button type="button" onClick={generateCode} className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm">
                      Generate
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Payment Terms</label>
                  <select
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Select...</option>
                    <option value="NET30">Net 30</option>
                    <option value="NET60">Net 60</option>
                    <option value="NET90">Net 90</option>
                    <option value="COD">Cash on Delivery</option>
                    <option value="PREPAID">Prepaid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Lead Time (days)</label>
                  <input
                    type="number"
                    value={formData.leadTimeDays}
                    onChange={(e) => setFormData({ ...formData, leadTimeDays: parseInt(e.target.value) || 0 })}
                    className="w-full border rounded px-3 py-2"
                    min="0"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-4 border-t">
                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  {editingSupplier ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
