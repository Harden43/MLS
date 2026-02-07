import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../services/api';
import { BarChart3, AlertTriangle, Download, Filter, Package } from 'lucide-react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

type ReportType = 'inventory-value' | 'low-stock' | 'dead-stock' | 'movement-history';

export function Reports() {
  const [activeReport, setActiveReport] = useState<ReportType>('inventory-value');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const { data: inventoryValue, isLoading: loadingInventory } = useQuery({
    queryKey: ['reports', 'inventory-value'],
    queryFn: reportsApi.getInventoryValue,
    enabled: activeReport === 'inventory-value'
  });

  const { data: lowStock, isLoading: loadingLowStock } = useQuery({
    queryKey: ['reports', 'low-stock'],
    queryFn: reportsApi.getLowStock,
    enabled: activeReport === 'low-stock'
  });

  const { data: deadStock, isLoading: loadingDeadStock } = useQuery({
    queryKey: ['reports', 'dead-stock'],
    queryFn: reportsApi.getDeadStock,
    enabled: activeReport === 'dead-stock',
  });

  const { data: movementHistory, isLoading: loadingMovements } = useQuery({
    queryKey: ['reports', 'movement-history', dateRange],
    queryFn: () => reportsApi.getMovementHistory(dateRange.startDate ? dateRange : undefined),
    enabled: activeReport === 'movement-history'
  });

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(item => Object.values(item).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const reportTabs = [
    { id: 'inventory-value', label: 'Inventory Value', icon: BarChart3 },
    { id: 'low-stock', label: 'Low Stock', icon: AlertTriangle },
    { id: 'dead-stock', label: 'Dead Stock', icon: Package },
    { id: 'movement-history', label: 'Movement History', icon: Package },
  ];

  const inventoryItems = inventoryValue?.data?.items || [];
  const inventoryTotals = inventoryValue?.data?.totals || { totalItems: 0, totalCostValue: 0, totalRetailValue: 0 };
  const lowStockItems = Array.isArray(lowStock?.data) ? lowStock.data : [];
  const deadStockItems = Array.isArray(deadStock?.data) ? deadStock.data : [];
  const movementItems = Array.isArray(movementHistory?.data) ? movementHistory.data : [];
      {/* Dead Stock Report */}
      {activeReport === 'dead-stock' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-600">
              Products with no sales/movement in 90 days: <span className="font-bold">{deadStockItems.length}</span>
            </p>
            <button
              onClick={() => exportToCSV(deadStockItems, 'dead-stock')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loadingDeadStock ? (
              <LoadingSpinner fullPage message="Loading reports..." />
            ) : deadStockItems.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <AlertTriangle size={48} className="mx-auto mb-4 text-green-500" />
                <p>No dead stock items found</p>
                <p className="text-sm">All products have recent sales or movement</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {deadStockItems.map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{item.name}</td>
                      <td className="px-6 py-4 text-gray-500">{item.sku}</td>
                      <td className="px-6 py-4">{item.categoryName || 'Uncategorized'}</td>
                      <td className="px-6 py-4">{item.supplierName || 'N/A'}</td>
                      <td className="px-6 py-4 text-right">{item.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
      </div>

      {/* Report Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {reportTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id as ReportType)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                activeReport === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Inventory Value Report */}
      {activeReport === 'inventory-value' && (
        <div>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-gray-500 text-sm">Total Items in Stock</div>
              <div className="text-2xl font-bold">{inventoryTotals.totalItems.toLocaleString()}</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg shadow">
              <div className="text-blue-600 text-sm">Total Cost Value</div>
              <div className="text-2xl font-bold text-blue-600">
                ${inventoryTotals.totalCostValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg shadow">
              <div className="text-green-600 text-sm">Total Retail Value</div>
              <div className="text-2xl font-bold text-green-600">
                ${inventoryTotals.totalRetailValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Export Button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => exportToCSV(inventoryItems, 'inventory-value')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loadingInventory ? (
              <LoadingSpinner fullPage message="Loading reports..." />
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost Value</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Retail Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {inventoryItems.map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{item.name}</td>
                      <td className="px-6 py-4 text-gray-500">{item.sku}</td>
                      <td className="px-6 py-4">{item.category}</td>
                      <td className="px-6 py-4 text-right">{item.stock}</td>
                      <td className="px-6 py-4 text-right">${item.cost.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">${item.price.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">${item.costValue.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">${item.retailValue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Low Stock Report */}
      {activeReport === 'low-stock' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-600">
              Products below their reorder point: <span className="font-bold">{lowStockItems.length}</span>
            </p>
            <button
              onClick={() => exportToCSV(lowStockItems, 'low-stock')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loadingLowStock ? (
              <LoadingSpinner fullPage message="Loading reports..." />
            ) : lowStockItems.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <AlertTriangle size={48} className="mx-auto mb-4 text-green-500" />
                <p>No low stock items found</p>
                <p className="text-sm">All products are above their reorder points</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Reorder Point</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Shortfall</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {lowStockItems.map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{item.name}</td>
                      <td className="px-6 py-4 text-gray-500">{item.sku}</td>
                      <td className="px-6 py-4">{item.categoryName || 'Uncategorized'}</td>
                      <td className="px-6 py-4">{item.supplierName || 'N/A'}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={item.stock === 0 ? 'text-red-600 font-bold' : 'text-yellow-600'}>
                          {item.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">{item.reorderPoint}</td>
                      <td className="px-6 py-4 text-right text-red-600 font-medium">
                        {item.reorderPoint - item.stock}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Movement History Report */}
      {activeReport === 'movement-history' && (
        <div>
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="border rounded-lg px-3 py-2"
                />
              </div>
              <button
                onClick={() => setDateRange({ startDate: '', endDate: '' })}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                <Filter size={18} />
                Clear Filters
              </button>
              <button
                onClick={() => exportToCSV(movementItems, 'movement-history')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 ml-auto"
              >
                <Download size={18} />
                Export CSV
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loadingMovements ? (
              <LoadingSpinner fullPage message="Loading reports..." />
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {movementItems.map((movement: any) => (
                    <tr key={movement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">
                        {new Date(movement.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{movement.product?.name}</div>
                        <div className="text-sm text-gray-500">{movement.product?.sku}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          movement.movementType === 'in' ? 'bg-green-100 text-green-800' :
                          movement.movementType === 'out' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {movement.movementType}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-right font-medium ${
                        movement.movementType === 'in' ? 'text-green-600' :
                        movement.movementType === 'out' ? 'text-red-600' : ''
                      }`}>
                        {movement.movementType === 'in' ? '+' : '-'}{movement.quantity}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{movement.reference || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{movement.notes || '-'}</td>
                    </tr>
                  ))}
                  {movementItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No movements found for the selected criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
