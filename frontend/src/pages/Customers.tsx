import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '../services/api';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Plus, Pencil, Trash2, X, Search, Users } from 'lucide-react';

interface Customer {
  id: number;
  name: string;
  code?: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  contactName?: string;
  isActive: boolean;
  _count?: { salesOrders: number; returns: number };
}

export function Customers() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '', code: '', email: '', phone: '', address: '', contactName: '', notes: '',
  });

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => customersApi.getAll(search ? { search } : undefined),
  });

  const createMutation = useMutation({
    mutationFn: customersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer created successfully');
      closeModal();
    },
    onError: (error: any) => { toast.error(error.response?.data?.error || 'Failed to create customer'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => customersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer updated successfully');
      closeModal();
    },
    onError: (error: any) => { toast.error(error.response?.data?.error || 'Failed to update customer'); },
  });

  const deleteMutation = useMutation({
    mutationFn: customersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deleted');
    },
    onError: (error: any) => { toast.error(error.response?.data?.error || 'Failed to delete customer'); },
  });

  const customersList: Customer[] = Array.isArray(customers?.data) ? customers.data : [];

  const openModal = (customer?: Customer) => {
    if (customer) {
      setEditing(customer);
      setFormData({
        name: customer.name, code: customer.code || '', email: customer.email || '',
        phone: customer.phone || '', address: customer.address || '',
        contactName: customer.contactName || '', notes: '',
      });
    } else {
      setEditing(null);
      setFormData({ name: '', code: '', email: '', phone: '', address: '', contactName: '', notes: '' });
    }
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditing(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...formData, code: formData.code || undefined };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) return <LoadingSpinner fullPage message="Loading customers..." />;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
        <button onClick={() => openModal()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          <Plus size={18} /> Add Customer
        </button>
      </div>

      <div className="bg-white p-4 rounded shadow mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text" placeholder="Search by name, email, or code..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-x-auto">
        {customersList.length === 0 ? (
          <EmptyState icon={Users} title="No customers yet" description="Add your first customer to start managing sales orders." action={{ label: 'Add Customer', onClick: () => openModal() }} />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-right">Orders</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {customersList.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">{c.code || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.email || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.phone || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.contactName || '-'}</td>
                  <td className="px-4 py-3 text-right">{c._count?.salesOrders || 0}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openModal(c)} className="text-blue-600 hover:text-blue-800 mr-2"><Pencil size={16} /></button>
                    <button onClick={() => setDeleteId(c.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
        title="Delete Customer" message="Are you sure you want to delete this customer?" confirmLabel="Delete" variant="danger"
      />

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-bold">{editing ? 'Edit Customer' : 'Add Customer'}</h2>
              <button onClick={closeModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border rounded px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Code</label>
                  <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full border rounded px-3 py-2 font-mono" placeholder="Auto or custom" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Person</label>
                  <input type="text" value={formData.contactName} onChange={(e) => setFormData({ ...formData, contactName: e.target.value })} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full border rounded px-3 py-2" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full border rounded px-3 py-2" />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-4 border-t">
                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
