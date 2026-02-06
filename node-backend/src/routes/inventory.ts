import { Router } from 'express';
import { prisma } from '../services/prisma';
import { validate } from '../middleware/validate';
import { authorize } from '../middleware/auth';
import { upsertInventorySchema } from '../schemas/common.schema';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const inventory = await prisma.inventory.findMany({
      include: { product: true, location: true },
      orderBy: { updatedAt: 'desc' }
    });
    res.json({ data: inventory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

router.post('/', authorize('ADMIN', 'USER'), validate(upsertInventorySchema), async (req, res) => {
  try {
    const { productId, locationId, quantity } = req.body;
    const inventory = await prisma.inventory.upsert({
      where: { productId_locationId: { productId, locationId } },
      update: { quantity },
      create: { productId, locationId, quantity },
      include: { product: true, location: true }
    });
    res.json({ data: inventory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update inventory' });
  }
});

export default router;
