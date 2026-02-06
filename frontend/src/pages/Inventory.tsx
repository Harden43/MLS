import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '../services/api';
import type { Inventory as InventoryType } from '../types/index';

export function Inventory() {
  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => inventoryApi.getAll(),
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Inventory</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {Array.isArray(inventory?.data) && inventory.data.map((item: InventoryType) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">{item.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{item.productId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{item.locationId}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    item.quantity > 10 ? 'bg-green-100 text-green-800' :
                    item.quantity > 0 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {item.quantity}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {new Date(item.updatedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {(!Array.isArray(inventory?.data) || inventory.data.length === 0) && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No inventory items yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
