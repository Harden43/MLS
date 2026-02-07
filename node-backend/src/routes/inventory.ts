import { Router } from 'express';
import { prisma } from '../services/prisma';
import { validate } from '../middleware/validate';
import { authorize } from '../middleware/auth';
import { upsertInventorySchema } from '../schemas/common.schema';

const router = Router();

router.get('/', authorize('ADMIN', 'USER'), async (req, res) => {
  try {
    const inventory = await prisma.inventory.findMany({
      where: {
        product: { organizationId: req.user.organizationId },
        location: { organizationId: req.user.organizationId },
      },
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
    // Ensure product and location belong to user's organization
    const product = await prisma.product.findFirst({ where: { id: productId, organizationId: req.user.organizationId } });
    const location = await prisma.location.findFirst({ where: { id: locationId, organizationId: req.user.organizationId } });
    if (!product || !location) {
      return res.status(404).json({ error: 'Product or Location not found in your organization' });
    }
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
