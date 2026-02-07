// Dead stock detection: products with no 'out' movement in the last 90 days

import { Router } from 'express';
import { prisma } from '../services/prisma';
const router = Router();

// Dead stock detection: products with no 'out' movement in the last 90 days
router.get('/dead-stock', async (req, res) => {
  try {
    const days = 90;
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Get all products for this organization
    const products = await prisma.product.findMany({ where: { isActive: true, organizationId: req.user.organizationId } });

    // Get all 'out' movements in the last 90 days for this organization
    const movements = await prisma.stockMovement.findMany({
      where: {
        movementType: 'out',
        createdAt: { gte: since },
        product: { organizationId: req.user.organizationId },
      },
      select: { productId: true },
    });

    // Set of productIds with 'out' movement
    const activeProductIds = new Set(movements.map(m => m.productId));

    // Dead stock: products with stock > 0 and no 'out' movement in last 90 days
    const deadStock = products.filter(p => p.stock > 0 && !activeProductIds.has(p.id));

    res.json({ data: deadStock });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate dead stock report' });
  }
});
// Average daily usage for all products (last 60 days)
router.get('/usage', async (req, res) => {
  try {
    const days = 60;
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Get all products for this organization
    const products = await prisma.product.findMany({ where: { isActive: true, organizationId: req.user.organizationId } });

    // Get all "out" stock movements in the last 60 days for this organization
    const movements = await prisma.stockMovement.findMany({
      where: {
        movementType: 'out',
        createdAt: { gte: since },
        product: { organizationId: req.user.organizationId },
      },
      select: { productId: true, quantity: true, createdAt: true },
    });

    // Group by productId and sum quantities
    const usageMap: Record<number, number> = {};
    for (const m of movements) {
      usageMap[m.productId] = (usageMap[m.productId] || 0) + m.quantity;
    }

    // Calculate average daily usage for each product
    const usageReport = products.map(p => {
      const totalUsed = usageMap[p.id] || 0;
      return {
        productId: p.id,
        productName: p.name,
        avgDailyUsage: +(totalUsed / days).toFixed(2),
        totalUsed,
        days,
      };
    });

    res.json({ data: usageReport });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate usage' });
  }
});



router.get('/inventory-value', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { stock: 'desc' }
    });

    const report = products.map(p => ({
      id: p.id, name: p.name, sku: p.sku,
      category: p.category?.name || 'Uncategorized',
      stock: p.stock,
      cost: p.cost ? Number(p.cost) : 0,
      price: Number(p.price),
      costValue: p.stock * (p.cost ? Number(p.cost) : 0),
      retailValue: p.stock * Number(p.price)
    }));

    const totals = {
      totalItems: report.reduce((sum, p) => sum + p.stock, 0),
      totalCostValue: report.reduce((sum, p) => sum + p.costValue, 0),
      totalRetailValue: report.reduce((sum, p) => sum + p.retailValue, 0)
    };

    res.json({ data: { items: report, totals } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

router.get('/low-stock', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true, supplier: true }
    });

    const lowStock = products.filter(p => p.stock <= p.reorderPoint);
    res.json({ data: lowStock });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

router.get('/movement-history', async (req, res) => {
  try {
    const { startDate, endDate, productId, movementType } = req.query;
    const where: any = {};

    if (startDate && endDate) {
      where.createdAt = { gte: new Date(startDate as string), lte: new Date(endDate as string) };
    }
    if (productId) where.productId = parseInt(productId as string);
    if (movementType) where.movementType = movementType;

    const movements = await prisma.stockMovement.findMany({
      where,
      include: { product: { select: { name: true, sku: true } } },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ data: movements });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

export default router;
