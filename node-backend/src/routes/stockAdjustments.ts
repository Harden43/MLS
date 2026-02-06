import { Router } from 'express';
import { prisma } from '../services/prisma';
import { validate } from '../middleware/validate';
import { authorize } from '../middleware/auth';
import { createStockAdjustmentSchema } from '../schemas/common.schema';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const adjustments = await prisma.stockAdjustment.findMany({
      include: { product: { select: { name: true, sku: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ data: adjustments });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stock adjustments' });
  }
});

router.post('/', authorize('ADMIN', 'USER'), validate(createStockAdjustmentSchema), async (req, res) => {
  try {
    const { productId, adjustmentType, quantity, reason, reference } = req.body;
    const adjustment = await prisma.stockAdjustment.create({
      data: { productId, adjustmentType, quantity, reason, reference, userId: req.user?.id },
      include: { product: { select: { name: true, sku: true } } }
    });
    await prisma.product.update({ where: { id: productId }, data: { stock: { increment: quantity } } });
    await prisma.stockMovement.create({
      data: { productId, quantity: Math.abs(quantity), movementType: 'adjustment', reference: 'ADJ-' + adjustment.id, notes: adjustmentType + ': ' + (reason || 'No reason'), userId: req.user?.id }
    });
    res.status(201).json({ data: adjustment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create stock adjustment' });
  }
});

export default router;
