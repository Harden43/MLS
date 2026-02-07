
import { Router, Request } from 'express';
import { prisma } from '../services/prisma';
import { authorize } from '../middleware/auth';
const router = Router();

// Top 5 items at risk (lowest stock vs usage)
router.get('/top-at-risk', authorize('ADMIN', 'USER'), async (req: Request, res) => {
  try {
    // Get average daily usage for all products (last 60 days)
    const days = 60;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const products = await prisma.product.findMany({ where: { isActive: true, organizationId: (req.user as any).organizationId } });
    const movements = await prisma.stockMovement.findMany({
      where: { movementType: 'out', createdAt: { gte: since } },
      select: { productId: true, quantity: true },
    });
    const usageMap: { [key: number]: number } = {};
    for (const m of movements) {
      usageMap[m.productId] = (usageMap[m.productId] || 0) + m.quantity;
    }
    const atRisk = products
      .map(p => {
        const avgDaily = (usageMap[p.id] || 0) / days;
        const daysLeft = avgDaily > 0 ? p.stock / avgDaily : null;
        return { id: p.id, name: p.name, sku: p.sku, stock: p.stock, avgDaily, daysLeft };
      })
      .filter(p => p.avgDaily > 0)
      .sort((a, b) => (a.daysLeft ?? Infinity) - (b.daysLeft ?? Infinity))
      .slice(0, 5);
    res.json({ data: atRisk });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get at-risk items' });
  }
});

// Top 5 items consuming cash (highest on-hand value)
router.get('/top-cash-consuming', authorize('ADMIN', 'USER'), async (req: Request, res) => {
  try {
    const products = await prisma.product.findMany({ where: { isActive: true, organizationId: (req.user as any).organizationId } });
    const cashItems = products
      .map(p => ({ id: p.id, name: p.name, sku: p.sku, stock: p.stock, cost: p.cost, value: p.stock * (p.cost || 0) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    res.json({ data: cashItems });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get cash-consuming items' });
  }
});

// Top 5 suppliers causing delays (most late POs in last 90 days)
router.get('/suppliers-delays', authorize('ADMIN', 'USER'), async (req: Request, res) => {
  try {
    const days = 90;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const latePOs = await prisma.purchaseOrder.findMany({
      where: {
        orderDate: { gte: since },
        expectedDate: { not: null },
        receivedDate: { not: null },
        status: 'received',
        organizationId: (req.user as any).organizationId,
      },
      select: { supplierId: true, expectedDate: true, receivedDate: true },
    });
    const delayMap: { [key: number]: number } = {};
    for (const po of latePOs) {
      const expected = po.expectedDate ? new Date(po.expectedDate) : null;
      const received = po.receivedDate ? new Date(po.receivedDate) : null;
      if (expected && received && received > expected) {
        delayMap[po.supplierId] = (delayMap[po.supplierId] || 0) + 1;
      }
    }
    const suppliers = await prisma.supplier.findMany({ where: { organizationId: (req.user as any).organizationId } });
    const delayedSuppliers = suppliers
      .map(s => ({ id: s.id, name: s.name, code: s.code, delayCount: delayMap[s.id] || 0 }))
      .filter(s => s.delayCount > 0)
      .sort((a, b) => b.delayCount - a.delayCount)
      .slice(0, 5);
    res.json({ data: delayedSuppliers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get suppliers with delays' });
  }
});



router.get('/stats', authorize('ADMIN', 'USER'), async (req: Request, res) => {
  try {
    const orgId = (req.user as any).organizationId;
    const [totalProducts, totalSuppliers, totalLocations, pendingOrders] = await Promise.all([
      prisma.product.count({ where: { isActive: true, organizationId: orgId } }),
      prisma.supplier.count({ where: { isActive: true, organizationId: orgId } }),
      prisma.location.count({ where: { isActive: true, organizationId: orgId } }),
      prisma.purchaseOrder.count({ where: { status: { in: ['pending', 'approved', 'ordered'] }, organizationId: orgId } })
    ]);

    const products = await prisma.product.findMany({
      where: { isActive: true, organizationId: orgId },
      select: { stock: true, cost: true, price: true, reorderPoint: true }
    });

    const lowStockProducts = products.filter(p => p.stock <= p.reorderPoint).length;

    const totalValue = products.reduce((sum, p) => {
      const cost = p.cost ? Number(p.cost) : Number(p.price);
      return sum + (p.stock * cost);
    }, 0);

    const totalRetailValue = products.reduce((sum, p) => sum + (p.stock * Number(p.price)), 0);

    const recentMovements = await prisma.stockMovement.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      where: { organizationId: orgId },
      include: { product: { select: { name: true, sku: true } } }
    });

    const unreadAlerts = await prisma.alert.count({
      where: { isRead: false, isDismissed: false, organizationId: orgId }
    });

    res.json({
      data: {
        totalProducts,
        lowStockProducts,
        totalValue,
        totalRetailValue,
        totalSuppliers,
        totalLocations,
        pendingOrders,
        unreadAlerts,
        recentMovements
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;
