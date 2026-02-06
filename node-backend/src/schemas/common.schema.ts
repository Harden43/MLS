import { z } from 'zod';

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid ID'),
  }),
});

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(255),
    sku: z.string().min(1, 'SKU is required').max(50),
    barcode: z.string().max(50).optional().nullable(),
    description: z.string().max(1000).optional().nullable(),
    stock: z.number().int().min(0).default(0),
    price: z.number().positive('Price must be positive'),
    cost: z.number().min(0).optional().nullable(),
    reorderPoint: z.number().int().min(0).default(10),
    minStock: z.number().int().min(0).default(0),
    maxStock: z.number().int().min(0).default(1000),
    unit: z.string().max(20).default('pcs'),
    categoryId: z.number().int().positive().optional().nullable(),
    supplierId: z.number().int().positive().optional().nullable(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid ID'),
  }),
  body: createProductSchema.shape.body.partial(),
});

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100),
    description: z.string().max(500).optional().nullable(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid ID'),
  }),
  body: createCategorySchema.shape.body.partial(),
});

export const createSupplierSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(255),
    code: z.string().max(20).optional().nullable(),
    contact: z.string().max(100).optional().nullable(),
    email: z.string().email('Invalid email format').optional().nullable().or(z.literal('')),
    phone: z.string().max(20).optional().nullable(),
    address: z.string().max(500).optional().nullable(),
    paymentTerms: z.string().max(100).optional().nullable(),
    leadTimeDays: z.number().int().min(0).default(7),
  }),
});

export const updateSupplierSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid ID'),
  }),
  body: createSupplierSchema.shape.body.partial(),
});

export const createLocationSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100),
    code: z.string().max(20).optional().nullable(),
    address: z.string().max(500).optional().nullable(),
    type: z.string().max(50).optional().nullable(),
  }),
});

export const updateLocationSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid ID'),
  }),
  body: createLocationSchema.shape.body.partial(),
});

export const createStockMovementSchema = z.object({
  body: z.object({
    productId: z.number().int().positive(),
    quantity: z.number().int().positive('Quantity must be positive'),
    movementType: z.enum(['in', 'out', 'adjustment', 'transfer']),
    reference: z.string().max(100).optional().nullable(),
    notes: z.string().max(500).optional().nullable(),
  }),
});

export const createStockAdjustmentSchema = z.object({
  body: z.object({
    productId: z.number().int().positive(),
    adjustmentType: z.string().min(1, 'Adjustment type is required'),
    quantity: z.number().int(),
    reason: z.string().max(500).optional().nullable(),
    reference: z.string().max(100).optional().nullable(),
  }),
});

export const createStockTransferSchema = z.object({
  body: z.object({
    productId: z.number().int().positive(),
    fromLocationId: z.number().int().positive(),
    toLocationId: z.number().int().positive(),
    quantity: z.number().int().positive('Quantity must be positive'),
    notes: z.string().max(500).optional().nullable(),
  }),
});

export const createPurchaseOrderSchema = z.object({
  body: z.object({
    supplierId: z.number().int().positive('Supplier is required'),
    items: z.array(z.object({
      productId: z.number().int().positive(),
      quantity: z.number().int().positive('Quantity must be positive'),
      unitPrice: z.number().positive('Unit price must be positive'),
    })).min(1, 'At least one item is required'),
    notes: z.string().max(1000).optional().nullable(),
    expectedDate: z.string().optional().nullable(),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid ID'),
  }),
  body: z.object({
    status: z.enum(['draft', 'pending', 'approved', 'ordered', 'partial', 'received', 'cancelled']),
  }),
});

export const receiveOrderSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid ID'),
  }),
  body: z.object({
    items: z.array(z.object({
      itemId: z.number().int().positive(),
      receivedQty: z.number().int().positive(),
    })).min(1),
  }),
});

export const upsertInventorySchema = z.object({
  body: z.object({
    productId: z.number().int().positive(),
    locationId: z.number().int().positive(),
    quantity: z.number().int().min(0),
  }),
});
