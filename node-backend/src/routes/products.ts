import { Router } from 'express';
import { prisma } from '../services/prisma';
import { validate } from '../middleware/validate';
import { authorize } from '../middleware/auth';
import { createProductSchema, updateProductSchema, idParamSchema } from '../schemas/common.schema';

const router = Router();

router.get('/', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const products = await prisma.product.findMany({
      where: { organizationId: (req.user as any).organizationId },
      include: { category: true, supplier: true },
      orderBy: { name: 'asc' }
    });
    res.json({ data: products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/:id', validate(idParamSchema), async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id), organizationId: (req.user as any).organizationId },
          include: { category: true, supplier: true, movements: { take: 10, orderBy: { createdAt: 'desc' } } }
        });
        if (!product) {
          return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ data: product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

router.post('/', authorize('ADMIN', 'USER'), validate(createProductSchema), async (req, res) => {
  try {
    const product = await prisma.product.create({
      data: {
        ...req.body,
        organizationId: (req.user as any).organizationId,
          },
          include: { category: true, supplier: true }
        });
        res.status(201).json({ data: product });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'SKU or barcode already exists' });
    }
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/:id', authorize('ADMIN', 'USER'), validate(updateProductSchema), async (req, res) => {
  try {
    // Ensure the product belongs to the user's organization
    const existing = await prisma.product.findFirst({
      where: { id: parseInt(req.params.id) },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const product = await prisma.product.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
      include: { category: true, supplier: true }
    });
    res.json({ data: product });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/:id', authorize('ADMIN'), validate(idParamSchema), async (req, res) => {
  try {
    const updated = await prisma.product.update({
      where: { id: parseInt(req.params.id) },
      data: { isActive: false },
    });
    res.json({ success: true, product: updated });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
