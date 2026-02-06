export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  stock: number;
  price: number;
  cost: number;
  description?: string;
  categoryId?: number;
  supplierId?: number;
  reorderPoint: number;
  minStock: number;
  maxStock: number;
  unit: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  supplier?: Supplier;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { products: number };
}

export interface Supplier {
  id: number;
  name: string;
  code?: string;
  contact?: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerms?: string;
  leadTimeDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { products: number; purchaseOrders: number };
}

export interface Location {
  id: number;
  name: string;
  code?: string;
  address?: string;
  type?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { inventory: number };
}

export interface Inventory {
  id: number;
  productId: number;
  locationId: number;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  product?: Product;
  location?: Location;
}

export interface StockMovement {
  id: number;
  productId: number;
  quantity: number;
  movementType: string;
  reference?: string;
  notes?: string;
  userId?: number;
  createdAt: string;
  updatedAt: string;
  product?: { name: string; sku: string };
}

export interface PurchaseOrder {
  id: number;
  orderNumber: string;
  supplierId: number;
  status: string;
  orderDate: string;
  expectedDate?: string;
  receivedDate?: string;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  createdBy?: number;
  approvedBy?: number;
  createdAt: string;
  updatedAt: string;
  supplier?: Supplier;
  items?: PurchaseOrderItem[];
  _count?: { items: number };
}

export interface PurchaseOrderItem {
  id: number;
  purchaseOrderId: number;
  productId: number;
  quantity: number;
  receivedQty: number;
  unitPrice: number;
  total: number;
  notes?: string;
  product?: Product;
}

export interface StockAdjustment {
  id: number;
  productId: number;
  adjustmentType: string;
  quantity: number;
  reason?: string;
  reference?: string;
  userId?: number;
  createdAt: string;
  product?: Product;
}

export interface StockTransfer {
  id: number;
  transferNumber: string;
  productId: number;
  fromLocationId: number;
  toLocationId: number;
  quantity: number;
  status: string;
  notes?: string;
  requestedBy?: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  product?: Product;
  fromLocation?: Location;
  toLocation?: Location;
}

export interface Alert {
  id: number;
  type: string;
  productId?: number;
  message: string;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalProducts: number;
  lowStockProducts: number;
  totalValue: number;
  totalRetailValue: number;
  totalSuppliers: number;
  totalLocations: number;
  pendingOrders: number;
  unreadAlerts: number;
  recentMovements: StockMovement[];
}
