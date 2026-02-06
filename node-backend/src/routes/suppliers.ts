import { Router } from 'express';
import { prisma } from '../services/prisma';
import { validate } from '../middleware/validate';
import { authorize } from '../middleware/auth';
import { createSupplierSchema, updateSupplierSchema, idParamSchema } from '../schemas/common.schema';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: { _count: { select: { products: true, purchaseOrders: true } } },
      orderBy: { name: 'asc' }
    });
    res.json({ data: suppliers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

router.get('/:id', validate(idParamSchema), async (req, res) => {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: parseInt(req.params.id) },
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
    const supplier = await prisma.supplier.create({ data: req.body });
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
