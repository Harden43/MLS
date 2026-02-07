import { useQuery } from '@tanstack/react-query';
import { stockMovementsApi } from '../services/api';
import type { StockMovement } from '../types/index';
import { ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function StockMovements() {
  const { data: movements, isLoading } = useQuery({
    queryKey: ['stockMovements'],
    queryFn: () => stockMovementsApi.getAll(),
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

  if (isLoading) {
    return <LoadingSpinner fullPage message="Loading stock movements..." />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Stock Movements</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {Array.isArray(movements?.data) && movements.data.map((movement: StockMovement) => (
              <tr key={movement.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {getMovementIcon(movement.movementType)}
                    <span className="capitalize">{movement.movementType}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{movement.productId}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`font-medium ${
                    movement.movementType.toLowerCase() === 'in' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {movement.movementType.toLowerCase() === 'in' ? '+' : '-'}{movement.quantity}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{movement.notes || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {new Date(movement.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {(!Array.isArray(movements?.data) || movements.data.length === 0) && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No stock movements yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
