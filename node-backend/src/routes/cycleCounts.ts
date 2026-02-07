import { Router, Request } from 'express';
import { prisma } from '../services/prisma';
import { authorize } from '../middleware/auth';

const router = Router();

// Get all cycle counts
router.get('/', authorize('ADMIN', 'USER'), async (req: Request, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { status } = req.query;
    const where: any = {
      location: { organizationId: (req.user as any).organizationId },
    };
    if (status) where.status = String(status);

    const counts = await prisma.cycleCount.findMany({
      where,
      include: {
        location: true,
        items: { include: { product: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: counts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch cycle counts' });
  }
});

// Get cycle count by ID
router.get('/:id', authorize('ADMIN', 'USER'), async (req: Request, res) => {
  try {
    const orgId = (req.user as any).organizationId;
    const count = await prisma.cycleCount.findFirst({
      where: { id: parseInt(req.params.id), location: { organizationId: orgId } },
      include: {
        location: true,
        items: { include: { product: true } },
      },
    });
    if (!count) return res.status(404).json({ error: 'Cycle count not found' });
    res.json({ data: count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch cycle count' });
  }
});

// Create cycle count - auto-populates items from inventory at that location
router.post('/', authorize('ADMIN', 'USER'), async (req: Request, res) => {
  try {
    const { locationId, notes } = req.body;
    if (!locationId) return res.status(400).json({ error: 'Location is required' });

    // Generate count number
    const lastCount = await prisma.cycleCount.findFirst({ orderBy: { id: 'desc' } });
    const countNum = lastCount ? parseInt(lastCount.countNumber.replace('CC-', '')) + 1 : 1;
    const countNumber = `CC-${String(countNum).padStart(5, '0')}`;

    // Get all inventory at this location
    const inventory = await prisma.inventory.findMany({
      where: { locationId: parseInt(String(locationId)) },
      include: { product: true },
    });

    const count = await prisma.cycleCount.create({
      data: {
        countNumber,
        locationId: parseInt(String(locationId)),
        notes,
        createdBy: (req as any).user?.id,
        items: {
          create: inventory.map((inv) => ({
            productId: inv.productId,
            systemQty: inv.quantity,
          })),
        },
      },
      include: {
        location: true,
        items: { include: { product: true } },
      },
    });

    res.status(201).json({ data: count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create cycle count' });
  }
});

// Submit counted quantities
router.patch('/:id/items', authorize('ADMIN', 'USER'), async (req: Request, res) => {
  try {
    const { items } = req.body; // [{ itemId, countedQty }]
    if (!items?.length) return res.status(400).json({ error: 'Items are required' });

    const orgId = (req.user as any).organizationId;
    const count = await prisma.cycleCount.findFirst({
      where: { id: parseInt(req.params.id), location: { organizationId: orgId } },
    });
    if (!count) return res.status(404).json({ error: 'Cycle count not found' });

    for (const item of items) {
      const existing = await prisma.cycleCountItem.findUnique({ where: { id: item.itemId } });
      if (!existing) continue;

      const variance = item.countedQty - existing.systemQty;
      await prisma.cycleCountItem.update({
        where: { id: item.itemId },
        data: {
          countedQty: item.countedQty,
          variance,
          countedAt: new Date(),
        },
      });
    }

    // Update status to in_progress
    const updated = await prisma.cycleCount.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'in_progress' },
      include: { location: true, items: { include: { product: true } } },
    });

    res.json({ data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update count items' });
  }
});

// Complete cycle count - apply adjustments for discrepancies
router.patch('/:id/complete', authorize('ADMIN', 'USER'), async (req: Request, res) => {
  try {
    const id = parseInt(req.params.id);
    const orgId = (req.user as any).organizationId;
    const count = await prisma.cycleCount.findFirst({
      where: { id, location: { organizationId: orgId } },
      include: { items: true },
    });
    if (!count) return res.status(404).json({ error: 'Cycle count not found' });

    // Apply adjustments for items with variance
    for (const item of count.items) {
      if (item.countedQty === null || item.variance === null || item.variance === 0) continue;

      // Create stock adjustment
      await prisma.stockAdjustment.create({
        data: {
          productId: item.productId,
          adjustmentType: 'correction',
          quantity: item.variance,
          reason: `Cycle count ${count.countNumber} adjustment`,
          reference: count.countNumber,
          userId: (req as any).user?.id,
        },
      });

      // Update product stock
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.variance } },
      });

      // Update inventory at location
      await prisma.inventory.updateMany({
        where: { productId: item.productId, locationId: count.locationId },
        data: { quantity: { increment: item.variance } },
      });

      // Create stock movement
      await prisma.stockMovement.create({
        data: {
          productId: item.productId,
          quantity: Math.abs(item.variance),
          movementType: 'adjustment',
          reference: count.countNumber,
          notes: `Cycle count correction: ${item.variance > 0 ? '+' : ''}${item.variance}`,
          userId: (req as any).user?.id,
        },
      });
    }

    const updated = await prisma.cycleCount.update({
      where: { id },
      data: { status: 'completed', completedAt: new Date() },
      include: { location: true, items: { include: { product: true } } },
    });

    res.json({ data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to complete cycle count' });
  }
});

// Delete cycle count
router.delete('/:id', authorize('ADMIN', 'USER'), async (req: Request, res) => {
  try {
    const orgId = (req.user as any).organizationId;
    const count = await prisma.cycleCount.findFirst({
      where: { id: parseInt(req.params.id), location: { organizationId: orgId } },
    });
    if (!count) return res.status(404).json({ error: 'Cycle count not found' });
    if (count.status === 'completed') {
      return res.status(400).json({ error: 'Cannot delete completed cycle counts' });
    }
    await prisma.cycleCount.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Cycle count deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete cycle count' });
  }
});

export default router;
