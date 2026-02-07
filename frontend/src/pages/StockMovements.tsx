import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { stockMovementsApi } from '../services/api';
import type { StockMovement } from '../types/index';
import { ArrowUp, ArrowDown, RefreshCw, Search, Filter } from 'lucide-react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Pagination } from '../components/ui/Pagination';

const MOVEMENT_TYPES = ['All', 'In', 'Out', 'Adjustment', 'Transfer'] as const;
const PAGE_LIMIT = 20;

export function StockMovements() {
  const [movementType, setMovementType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: movements, isLoading } = useQuery({
    queryKey: ['stockMovements', movementType, startDate, endDate, page],
    queryFn: () =>
      stockMovementsApi.getAll({
        movementType: movementType || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit: PAGE_LIMIT,
      }),
  });

  const getMovementIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'in':
        return <ArrowUp className="text-green-500" size={18} />;
      case 'out':
        return <ArrowDown className="text-red-500" size={18} />;
      default:
        return <RefreshCw className="text-blue-500" size={18} />;
    }
  };

  const filteredMovements = Array.isArray(movements?.data)
    ? movements.data.filter((m: StockMovement) => {
        if (!productSearch) return true;
        const search = productSearch.toLowerCase();
        return (
          m.product?.name?.toLowerCase().includes(search) ||
          m.product?.sku?.toLowerCase().includes(search)
        );
      })
    : [];

  const totalPages = movements?.pagination?.totalPages || Math.ceil((movements?.total || 0) / PAGE_LIMIT) || 1;

  const handleFilterChange = (setter: (val: string) => void) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setter(e.target.value);
    setPage(1);
  };

  if (isLoading) {
    return <LoadingSpinner fullPage message="Loading stock movements..." />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Stock Movements</h1>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-600">
          <Filter size={16} />
          Filters
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Movement Type */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Movement Type</label>
            <select
              value={movementType}
              onChange={handleFilterChange(setMovementType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {MOVEMENT_TYPES.map((type) => (
                <option key={type} value={type === 'All' ? '' : type.toLowerCase()}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={handleFilterChange(setStartDate)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={handleFilterChange(setEndDate)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Product Search */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Product Search</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or SKU..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredMovements.map((movement: StockMovement) => (
              <tr key={movement.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {getMovementIcon(movement.movementType)}
                    <StatusBadge status={movement.movementType.toLowerCase() === 'out' ? 'out_movement' : movement.movementType.toLowerCase()} label={movement.movementType} />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {movement.product?.name || `Product #${movement.productId}`}
                    </div>
                    {movement.product?.sku && (
                      <div className="text-xs text-gray-500">{movement.product.sku}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`font-semibold ${
                      movement.movementType.toLowerCase() === 'in'
                        ? 'text-green-600'
                        : movement.movementType.toLowerCase() === 'out'
                        ? 'text-red-600'
                        : 'text-blue-600'
                    }`}
                  >
                    {movement.movementType.toLowerCase() === 'in' ? '+' : movement.movementType.toLowerCase() === 'out' ? '-' : ''}
                    {movement.quantity}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {movement.reference || '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                  {movement.notes || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(movement.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
              </tr>
            ))}
            {filteredMovements.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No stock movements found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="border-t border-gray-200 px-4 py-2">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
