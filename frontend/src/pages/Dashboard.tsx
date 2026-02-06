
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi, alertsApi, reportsApi } from '../services/api';
import type { DashboardStats, Alert, StockMovement } from '../types/index';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

export function Dashboard() {
  const queryClient = useQueryClient();

  // Dashboard insights
  const { data: atRiskData } = useQuery({
    queryKey: ['dashboard', 'top-at-risk'],
    queryFn: dashboardApi.getTopAtRisk,
  });
  const { data: cashConsumingData } = useQuery({
    queryKey: ['dashboard', 'top-cash-consuming'],
    queryFn: dashboardApi.getTopCashConsuming,
  });
  const { data: suppliersDelaysData } = useQuery({
    queryKey: ['dashboard', 'suppliers-delays'],
    queryFn: dashboardApi.getSuppliersDelays,
  });

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardApi.getStats,
  });

  const { data: alertsData } = useQuery({
    queryKey: ['alerts'],
    queryFn: alertsApi.getAll,
  });

  const { data: lowStockData } = useQuery({
    queryKey: ['reports', 'low-stock'],
    queryFn: reportsApi.getLowStock,
  });

  const dismissAlert = useMutation({
    mutationFn: alertsApi.dismiss,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    }
  });

  const generateAlerts = useMutation({
    mutationFn: alertsApi.generateLowStock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    }
  });

  const stats: DashboardStats = statsData?.data || {
    totalProducts: 0,
    lowStockProducts: 0,
    totalValue: 0,
    totalRetailValue: 0,
    totalSuppliers: 0,
    totalLocations: 0,
    pendingOrders: 0,
    unreadAlerts: 0,
    recentMovements: []
  };

  const alerts = Array.isArray(alertsData?.data) ? alertsData.data : [];
  const lowStockItems = Array.isArray(lowStockData?.data) ? lowStockData.data.slice(0, 8) : [];

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div>
      {/* Dashboard Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Top 5 At-Risk Items */}
        <div className="bg-white rounded shadow p-4">
          <h2 className="font-semibold mb-2 text-red-700">Top 5 Items at Risk</h2>
          {Array.isArray(atRiskData?.data) && atRiskData.data.length > 0 ? (
            <ul className="text-sm space-y-1">
              {atRiskData.data.map((item: any) => (
                <li key={item.id} className="flex justify-between">
                  <span>{item.name} <span className="text-xs text-gray-400">({item.sku})</span></span>
                  <span className="text-red-600 font-semibold">{item.daysLeft !== null ? `${item.daysLeft.toFixed(1)} days left` : 'N/A'}</span>
                </li>
              ))}
            </ul>
          ) : <div className="text-gray-400 text-xs">No at-risk items</div>}
        </div>
        {/* Top 5 Cash-Consuming Items */}
        <div className="bg-white rounded shadow p-4">
          <h2 className="font-semibold mb-2 text-yellow-700">Top 5 Items Consuming Cash</h2>
          {Array.isArray(cashConsumingData?.data) && cashConsumingData.data.length > 0 ? (
            <ul className="text-sm space-y-1">
              {cashConsumingData.data.map((item: any) => (
                <li key={item.id} className="flex justify-between">
                  <span>{item.name} <span className="text-xs text-gray-400">({item.sku})</span></span>
                  <span className="text-yellow-700 font-semibold">${item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </li>
              ))}
            </ul>
          ) : <div className="text-gray-400 text-xs">No high-value items</div>}
        </div>
        {/* Suppliers Causing Delays */}
        <div className="bg-white rounded shadow p-4">
          <h2 className="font-semibold mb-2 text-blue-700">Suppliers Causing Delays</h2>
          {Array.isArray(suppliersDelaysData?.data) && suppliersDelaysData.data.length > 0 ? (
            <ul className="text-sm space-y-1">
              {suppliersDelaysData.data.map((s: any) => (
                <li key={s.id} className="flex justify-between">
                  <span>{s.name} <span className="text-xs text-gray-400">{s.code ? `(${s.code})` : ''}</span></span>
                  <span className="text-blue-700 font-semibold">{s.delayCount} late POs</span>
                </li>
              ))}
            </ul>
          ) : <div className="text-gray-400 text-xs">No supplier delays</div>}
        </div>
      </div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <button
          onClick={() => generateAlerts.mutate()}
          className="px-3 py-1.5 text-sm bg-gray-100 rounded hover:bg-gray-200"
        >
          Refresh Alerts
        </button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-yellow-800">Alerts ({alerts.length})</span>
          </div>
          <div className="space-y-1">
            {alerts.slice(0, 3).map((alert: Alert) => (
              <div key={alert.id} className="flex justify-between items-center bg-white p-2 rounded text-sm">
                <span className="text-gray-700">{alert.message}</span>
                <button onClick={() => dismissAlert.mutate(alert.id)} className="text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        <Link to="/products" className="bg-white p-4 rounded shadow hover:shadow-md">
          <div className="text-xs text-gray-500 uppercase">Products</div>
          <div className="text-xl font-bold">{stats.totalProducts}</div>
        </Link>
        <Link to="/reports" className="bg-white p-4 rounded shadow hover:shadow-md">
          <div className="text-xs text-gray-500 uppercase">Low Stock</div>
          <div className={`text-xl font-bold ${stats.lowStockProducts > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {stats.lowStockProducts}
          </div>
        </Link>
        <Link to="/suppliers" className="bg-white p-4 rounded shadow hover:shadow-md">
          <div className="text-xs text-gray-500 uppercase">Suppliers</div>
          <div className="text-xl font-bold">{stats.totalSuppliers}</div>
        </Link>
        <Link to="/locations" className="bg-white p-4 rounded shadow hover:shadow-md">
          <div className="text-xs text-gray-500 uppercase">Locations</div>
          <div className="text-xl font-bold">{stats.totalLocations}</div>
        </Link>
        <Link to="/purchase-orders" className="bg-white p-4 rounded shadow hover:shadow-md">
          <div className="text-xs text-gray-500 uppercase">Pending POs</div>
          <div className="text-xl font-bold">{stats.pendingOrders}</div>
        </Link>
        <Link to="/reports" className="bg-white p-4 rounded shadow hover:shadow-md">
          <div className="text-xs text-gray-500 uppercase">Inventory Value</div>
          <div className="text-xl font-bold">${stats.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Low Stock Items */}
        <div className="bg-white rounded shadow">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="font-semibold">Low Stock Items</h2>
            <Link to="/reports" className="text-sm text-blue-600 hover:underline">View All</Link>
          </div>
          <div className="p-4">
            {lowStockItems.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="pb-2">Product</th>
                    <th className="pb-2 text-right">Stock</th>
                    <th className="pb-2 text-right">Reorder</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.map((item: any) => (
                    <tr key={item.id} className="border-t">
                      <td className="py-2">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.sku}</div>
                      </td>
                      <td className={`py-2 text-right font-medium ${item.stock === 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                        {item.stock}
                      </td>
                      <td className="py-2 text-right text-gray-500">{item.reorderPoint}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                All products are well stocked
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded shadow">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="font-semibold">Recent Activity</h2>
            <Link to="/movements" className="text-sm text-blue-600 hover:underline">View All</Link>
          </div>
          <div className="p-4">
            {stats.recentMovements && stats.recentMovements.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="pb-2">Product</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2 text-right">Qty</th>
                    <th className="pb-2 text-right">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentMovements.map((m: StockMovement) => (
                    <tr key={m.id} className="border-t">
                      <td className="py-2">{m.product?.name}</td>
                      <td className="py-2">
                        <span className={`px-1.5 py-0.5 text-xs rounded ${
                          m.movementType === 'in' ? 'bg-green-100 text-green-700' :
                          m.movementType === 'out' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {m.movementType}
                        </span>
                      </td>
                      <td className={`py-2 text-right ${m.movementType === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                        {m.movementType === 'in' ? '+' : '-'}{m.quantity}
                      </td>
                      <td className="py-2 text-right text-gray-500 text-xs">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                No recent activity
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-4 bg-white rounded shadow p-4">
        <h2 className="font-semibold mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <Link to="/products" className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100">
            Add Product
          </Link>
          <Link to="/purchase-orders" className="px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded hover:bg-green-100">
            Create PO
          </Link>
          <Link to="/adjustments" className="px-3 py-1.5 text-sm bg-orange-50 text-orange-700 rounded hover:bg-orange-100">
            Stock Adjustment
          </Link>
          <Link to="/transfers" className="px-3 py-1.5 text-sm bg-purple-50 text-purple-700 rounded hover:bg-purple-100">
            Transfer Stock
          </Link>
          <Link to="/reports" className="px-3 py-1.5 text-sm bg-gray-50 text-gray-700 rounded hover:bg-gray-100">
            View Reports
          </Link>
        </div>
      </div>
    </div>
  );
}
