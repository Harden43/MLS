import { Router } from 'express';
import { prisma } from '../services/prisma';
import { validate } from '../middleware/validate';
import { idParamSchema } from '../schemas/common.schema';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const alerts = await prisma.alert.findMany({
      where: { isDismissed: false },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ data: alerts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

router.patch('/:id/dismiss', validate(idParamSchema), async (req, res) => {
  try {
    const alert = await prisma.alert.update({
      where: { id: parseInt(req.params.id) },
      data: { isDismissed: true }
    });
    res.json({ data: alert });
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Alert not found' });
    res.status(500).json({ error: 'Failed to dismiss alert' });
  }
});

router.post('/generate-low-stock', async (req, res) => {
  try {
    const lowStockProducts = await prisma.product.findMany({
      where: { isActive: true, stock: { lte: prisma.product.fields.reorderPoint } }
    });

    let created = 0;
    for (const product of lowStockProducts) {
      const existing = await prisma.alert.findFirst({
        where: { type: 'low_stock', productId: product.id, isDismissed: false }
      });

      if (!existing) {
        await prisma.alert.create({
          data: {
            type: 'low_stock',
            productId: product.id,
            message: 'Low stock: ' + product.name + ' (SKU: ' + product.sku + ') has ' + product.stock + ' units. Reorder point: ' + product.reorderPoint
          }
        });
        created++;
      }
    }

    res.json({ success: true, alertsCreated: created });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate alerts' });
  }
});

export default router;
