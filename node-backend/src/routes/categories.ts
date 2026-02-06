import { Router } from 'express';
import { prisma } from '../services/prisma';
import { validate } from '../middleware/validate';
import { authorize } from '../middleware/auth';
import { createCategorySchema, updateCategorySchema, idParamSchema } from '../schemas/common.schema';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' }
    });
    res.json({ data: categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.post('/', authorize('ADMIN', 'USER'), validate(createCategorySchema), async (req, res) => {
  try {
    const category = await prisma.category.create({ data: req.body });
    res.status(201).json({ data: category });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Category name already exists' });
    }
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put('/:id', authorize('ADMIN', 'USER'), validate(updateCategorySchema), async (req, res) => {
  try {
    const category = await prisma.category.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json({ data: category });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/:id', authorize('ADMIN'), validate(idParamSchema), async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
