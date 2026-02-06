import { Router } from 'express';
import { prisma } from '../services/prisma';
import { validate } from '../middleware/validate';
import { authorize } from '../middleware/auth';
import { createStockMovementSchema } from '../schemas/common.schema';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const movements = await prisma.stockMovement.findMany({
      include: { product: { select: { name: true, sku: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json({ data: movements });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch stock movements' });
  }
});

router.post('/', authorize('ADMIN', 'USER'), validate(createStockMovementSchema), async (req, res) => {
  try {
    const { productId, quantity, movementType, notes, reference } = req.body;
    const movement = await prisma.stockMovement.create({
      data: { productId, quantity, movementType, notes, reference, userId: req.user?.id },
      include: { product: { select: { name: true, sku: true } } }
    });

    const stockChange = movementType === 'in' ? quantity : -quantity;
    await prisma.product.update({
      where: { id: productId },
      data: { stock: { increment: stockChange } }
    });

    res.status(201).json({ data: movement });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create stock movement' });
  }
});

export default router;
