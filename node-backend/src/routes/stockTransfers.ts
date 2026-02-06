import { Router } from 'express';
import { prisma } from '../services/prisma';
import { validate } from '../middleware/validate';
import { authorize } from '../middleware/auth';
import { createStockTransferSchema, idParamSchema } from '../schemas/common.schema';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const transfers = await prisma.stockTransfer.findMany({
      include: { product: { select: { name: true, sku: true } }, fromLocation: true, toLocation: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ data: transfers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stock transfers' });
  }
});

router.post('/', authorize('ADMIN', 'USER'), validate(createStockTransferSchema), async (req, res) => {
  try {
    const { productId, fromLocationId, toLocationId, quantity, notes } = req.body;
    const count = await prisma.stockTransfer.count();
    const transferNumber = 'TRF-' + String(count + 1).padStart(5, '0');
    const transfer = await prisma.stockTransfer.create({
      data: { transferNumber, productId, fromLocationId, toLocationId, quantity, notes, requestedBy: req.user?.id },
      include: { product: { select: { name: true, sku: true } }, fromLocation: true, toLocation: true }
    });
    res.status(201).json({ data: transfer });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create stock transfer' });
  }
});

router.patch('/:id/complete', authorize('ADMIN', 'USER'), validate(idParamSchema), async (req, res) => {
  try {
    const transferId = parseInt(req.params.id);
    const transfer = await prisma.stockTransfer.findUnique({ where: { id: transferId } });
    if (!transfer) return res.status(404).json({ error: 'Transfer not found' });
    if (transfer.status !== 'pending') return res.status(400).json({ error: 'Transfer not pending' });

    await prisma.inventory.upsert({ where: { productId_locationId: { productId: transfer.productId, locationId: transfer.fromLocationId } }, update: { quantity: { decrement: transfer.quantity } }, create: { productId: transfer.productId, locationId: transfer.fromLocationId, quantity: -transfer.quantity } });
    await prisma.inventory.upsert({ where: { productId_locationId: { productId: transfer.productId, locationId: transfer.toLocationId } }, update: { quantity: { increment: transfer.quantity } }, create: { productId: transfer.productId, locationId: transfer.toLocationId, quantity: transfer.quantity } });
    await prisma.stockMovement.create({ data: { productId: transfer.productId, quantity: transfer.quantity, movementType: 'transfer', reference: transfer.transferNumber, notes: 'Transfer completed', userId: req.user?.id } });

    const updated = await prisma.stockTransfer.update({ where: { id: transferId }, data: { status: 'completed', completedAt: new Date() }, include: { product: { select: { name: true, sku: true } }, fromLocation: true, toLocation: true } });
    res.json({ data: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete transfer' });
  }
});

export default router;
