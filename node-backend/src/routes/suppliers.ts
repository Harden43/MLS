import { Router } from 'express';
import { prisma } from '../services/prisma';
import { validate } from '../middleware/validate';
import { authorize } from '../middleware/auth';
import { createSupplierSchema, updateSupplierSchema, idParamSchema } from '../schemas/common.schema';

const router = Router();

router.get('/', authorize('ADMIN', 'USER'), async (req, res) => {
  try {
          if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
          const suppliers = await prisma.supplier.findMany({
      where: { organizationId: (req.user as any).organizationId },
      include: { _count: { select: { products: true, purchaseOrders: true } } },
      orderBy: { name: 'asc' }
    });
    res.json({ data: suppliers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

router.get('/:id', authorize('ADMIN', 'USER'), validate(idParamSchema), async (req, res) => {
  try {
    const orgId = (req.user as any).organizationId;
    const supplier = await prisma.supplier.findFirst({
      where: { id: parseInt(req.params.id), organizationId: orgId },
      include: { products: true, purchaseOrders: { take: 10, orderBy: { createdAt: 'desc' } } }
    });
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.json({ data: supplier });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch supplier' });
  }
});

router.post('/', authorize('ADMIN', 'USER'), validate(createSupplierSchema), async (req, res) => {
  try {
    const orgId = (req.user as any).organizationId;
    const supplier = await prisma.supplier.create({
      data: {
        ...req.body,
        organizationId: orgId,
      }
    });
    res.status(201).json({ data: supplier });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Supplier code already exists' });
    }
    res.status(500).json({ error: 'Failed to create supplier' });
  }
});

router.put('/:id', authorize('ADMIN', 'USER'), validate(updateSupplierSchema), async (req, res) => {
  try {
    // Ensure the supplier belongs to the user's organization
    const orgId = (req.user as any).organizationId;
    const existing = await prisma.supplier.findFirst({
      where: { id: parseInt(req.params.id), organizationId: orgId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    const supplier = await prisma.supplier.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json({ data: supplier });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.status(500).json({ error: 'Failed to update supplier' });
  }
});

router.delete('/:id', authorize('ADMIN'), validate(idParamSchema), async (req, res) => {
  try {
    await prisma.supplier.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
});

export default router;
