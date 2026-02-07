import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { locationsApi } from '../services/api';
import type { Location } from '../types/index';
import { Plus, Edit, Trash2, X, MapPin, Warehouse, Building, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

const LOCATION_TYPES = [
  { value: 'warehouse', label: 'Warehouse', icon: Warehouse },
  { value: 'store', label: 'Store', icon: Store },
  { value: 'office', label: 'Office', icon: Building },
];

export function Locations() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    type: 'warehouse'
  });

  const { data: locations, isLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: locationsApi.getAll
  });

  const createMutation = useMutation({
    mutationFn: locationsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setShowModal(false);
      resetForm();
      toast.success('Location created successfully');
    },
    onError: () => {
      toast.error('Failed to create location');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => locationsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setShowModal(false);
      setEditingLocation(null);
      resetForm();
      toast.success('Location updated successfully');
    },
    onError: () => {
      toast.error('Failed to update location');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: locationsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setDeleteId(null);
      toast.success('Location deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete location');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      address: '',
      type: 'warehouse'
    });
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      code: location.code || '',
      address: location.address || '',
      type: location.type || 'warehouse'
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLocation) {
      updateMutation.mutate({ id: editingLocation.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
  };

  const getTypeIcon = (type: string) => {
    const typeInfo = LOCATION_TYPES.find(t => t.value === type);
    const Icon = typeInfo?.icon || MapPin;
    return <Icon size={20} />;
  };

  const locationsList = Array.isArray(locations?.data) ? locations.data : [];

  if (isLoading) {
    return <LoadingSpinner fullPage message="Loading locations..." />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Locations</h1>
        <button
          onClick={() => { setEditingLocation(null); resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Add Location
        </button>
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locationsList.map((location: Location) => (
          <div key={location.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  {getTypeIcon(location.type || 'warehouse')}
                </div>
                <div>
                  <h3 className="font-medium">{location.name}</h3>
                  {location.code && (
                    <span className="text-xs text-gray-500">Code: {location.code}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(location)}
                  className="p-1 text-gray-400 hover:text-blue-600"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(location.id)}
                  className="p-1 text-gray-400 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {location.address && (
              <p className="text-sm text-gray-600 mb-2">{location.address}</p>
            )}

            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-xs text-gray-500 capitalize">
                {location.type || 'Unknown'}
              </span>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                {location._count?.inventory || 0} items
              </span>
            </div>
          </div>
        ))}

        {locationsList.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <MapPin size={48} className="mx-auto mb-4 opacity-50" />
            <p>No locations found</p>
            <p className="text-sm">Add your first warehouse or store location</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold">
                {editingLocation ? 'Edit Location' : 'Add Location'}
              </h2>
              <button onClick={() => { setShowModal(false); setEditingLocation(null); resetForm(); }}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g., Main Warehouse"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g., WH-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  {LOCATION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                  placeholder="Full address..."
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingLocation(null); resetForm(); }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingLocation ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteId !== null}
        onConfirm={() => deleteId !== null && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        title="Delete Location"
        message="Are you sure you want to delete this location? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
