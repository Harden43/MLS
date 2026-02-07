import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cycleCountsApi, locationsApi } from '../services/api';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Plus, Eye, Trash2, X, ClipboardCheck, CheckCircle, Save } from 'lucide-react';

const STATUS_OPTIONS = ['all', 'planned', 'in_progress', 'completed'] as const;

export function CycleCounts() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCountModal, setShowCountModal] = useState(false);
  const [selectedCount, setSelectedCount] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [countedItems, setCountedItems] = useState<Record<number, number>>({});
  const [createData, setCreateData] = useState({ locationId: 0, notes: '' });

  const { data: counts, isLoading } = useQuery({
    queryKey: ['cycle-counts', statusFilter],
    queryFn: () => cycleCountsApi.getAll(statusFilter !== 'all' ? { status: statusFilter } : undefined),
  });

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: locationsApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: cycleCountsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycle-counts'] });
      setShowCreateModal(false);
      setCreateData({ locationId: 0, notes: '' });
      toast.success('Cycle count created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create cycle count');
    },
  });

  const submitItemsMutation = useMutation({
    mutationFn: ({ id, items }: { id: number; items: { itemId: number; countedQty: number }[] }) =>
      cycleCountsApi.submitItems(id, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycle-counts'] });
      toast.success('Counts saved successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to save counts');
    },
  });

  const completeMutation = useMutation({
    mutationFn: cycleCountsApi.complete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycle-counts'] });
      setShowCountModal(false);
      setSelectedCount(null);
      toast.success('Cycle count completed! Stock adjustments applied.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to complete cycle count');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => cycleCountsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycle-counts'] });
      setDeleteTarget(null);
      toast.success('Cycle count deleted');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete cycle count');
    },
  });

  const openCountModal = (count: any) => {
    setSelectedCount(count);
    const initial: Record<number, number> = {};
    count.items?.forEach((item: any) => {
      initial[item.id] = item.countedQty ?? item.systemQty;
    });
    setCountedItems(initial);
    setShowCountModal(true);
  };

  const handleSaveCounts = () => {
    if (!selectedCount) return;
    const items = Object.entries(countedItems).map(([itemId, countedQty]) => ({
      itemId: parseInt(itemId),
      countedQty,
    }));
    submitItemsMutation.mutate({ id: selectedCount.id, items });
  };

  const handleComplete = () => {
    if (!selectedCount) return;
    completeMutation.mutate(selectedCount.id);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (createData.locationId) {
      createMutation.mutate(createData);
    }
  };

  const locationsList = Array.isArray(locations?.data) ? locations.data : [];
  const countsList = Array.isArray(counts?.data) ? counts.data : [];

  if (isLoading) {
    return <LoadingSpinner fullPage message="Loading cycle counts..." />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Cycle Counts</h1>
        <div className="flex items-center gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All Statuses' : s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            New Count
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {countsList.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No cycle counts found"
            description="Start a cycle count to verify inventory at a location."
            action={{ label: 'New Count', onClick: () => setShowCreateModal(true) }}
          />
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {countsList.map((count: any) => (
                <tr key={count.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{count.countNumber}</td>
                  <td className="px-6 py-4">{count.location?.name || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={count.status} />
                  </td>
                  <td className="px-6 py-4">{count._count?.items || count.items?.length || 0}</td>
                  <td className="px-6 py-4">{new Date(count.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openCountModal(count)}
                        className="text-blue-600 hover:text-blue-800"
                        title={count.status === 'completed' ? 'View' : 'Count'}
                      >
                        {count.status === 'completed' ? <Eye size={18} /> : <ClipboardCheck size={18} />}
                      </button>
                      {count.status !== 'completed' && (
                        <button
                          onClick={() => setDeleteTarget(count)}
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
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold">New Cycle Count</h2>
              <button onClick={() => setShowCreateModal(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Location *</label>
                <select
                  value={createData.locationId}
                  onChange={(e) => setCreateData({ ...createData, locationId: parseInt(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                >
                  <option value={0}>Select Location</option>
                  {locationsList.map((l: any) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">All inventory items at this location will be included.</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={createData.notes}
                  onChange={(e) => setCreateData({ ...createData, notes: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Creating...' : 'Start Count'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Count / View Modal */}
      {showCountModal && selectedCount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <div>
                <h2 className="text-xl font-bold">Count {selectedCount.countNumber}</h2>
                <p className="text-sm text-gray-500">{selectedCount.location?.name}</p>
              </div>
              <button onClick={() => { setShowCountModal(false); setSelectedCount(null); }}>
                <X size={24} />
              </button>
            </div>
            <div className="p-4">
              {selectedCount.items && selectedCount.items.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Product</th>
                      <th className="px-4 py-2 text-right">System Qty</th>
                      <th className="px-4 py-2 text-right">Counted Qty</th>
                      <th className="px-4 py-2 text-right">Variance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedCount.items.map((item: any) => {
                      const counted = countedItems[item.id] ?? item.countedQty;
                      const variance = counted !== undefined && counted !== null ? Number(counted) - item.systemQty : null;
                      return (
                        <tr key={item.id}>
                          <td className="px-4 py-2">{item.product?.name || `Product #${item.productId}`}</td>
                          <td className="px-4 py-2 text-right">{item.systemQty}</td>
                          <td className="px-4 py-2 text-right">
                            {selectedCount.status === 'completed' ? (
                              <span>{item.countedQty ?? '-'}</span>
                            ) : (
                              <input
                                type="number"
                                value={countedItems[item.id] ?? ''}
                                onChange={(e) => setCountedItems({
                                  ...countedItems,
                                  [item.id]: parseInt(e.target.value) || 0,
                                })}
                                className="w-24 border rounded px-2 py-1 text-right"
                                min="0"
                              />
                            )}
                          </td>
                          <td className={`px-4 py-2 text-right font-medium ${
                            variance === null ? '' : variance === 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {variance === null ? '-' : variance > 0 ? `+${variance}` : variance}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500 text-center py-8">No inventory items found at this location.</p>
              )}

              {selectedCount.status !== 'completed' && selectedCount.items?.length > 0 && (
                <div className="flex gap-2 justify-end mt-4 pt-4 border-t">
                  <button
                    onClick={handleSaveCounts}
                    disabled={submitItemsMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Save size={18} />
                    {submitItemsMutation.isPending ? 'Saving...' : 'Save Counts'}
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={completeMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle size={18} />
                    {completeMutation.isPending ? 'Completing...' : 'Complete & Adjust Stock'}
                  </button>
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
        title="Delete Cycle Count"
        message={`Are you sure you want to delete count ${deleteTarget?.countNumber}?`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
