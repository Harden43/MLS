import { Router } from 'express';
import { prisma } from '../services/prisma';
import { validate } from '../middleware/validate';
import { authorize } from '../middleware/auth';
import { createLocationSchema, updateLocationSchema, idParamSchema } from '../schemas/common.schema';

const router = Router();

router.get('/', authorize('ADMIN'), async (req, res) => {
  try {
    const locations = await prisma.location.findMany({
      where: { organizationId: req.user.organizationId },
      include: { _count: { select: { inventory: true } } },
      orderBy: { name: 'asc' }
    });
    res.json({ data: locations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

router.post('/', authorize('ADMIN'), validate(createLocationSchema), async (req, res) => {
  try {
    const location = await prisma.location.create({
      data: {
        ...req.body,
        organizationId: req.user.organizationId,
      }
    });
    res.status(201).json({ data: location });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Location code already exists' });
    }
    res.status(500).json({ error: 'Failed to create location' });
  }
});

router.put('/:id', authorize('ADMIN'), validate(updateLocationSchema), async (req, res) => {
  try {
    // Ensure the location belongs to the user's organization
    const existing = await prisma.location.findFirst({
      where: { id: parseInt(req.params.id), organizationId: req.user.organizationId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Location not found' });
    }
    const location = await prisma.location.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json({ data: location });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Location not found' });
    }
    res.status(500).json({ error: 'Failed to update location' });
  }
});

router.delete('/:id', authorize('ADMIN'), validate(idParamSchema), async (req, res) => {
  try {
    // Ensure the location belongs to the user's organization
    const existing = await prisma.location.findFirst({
      where: { id: parseInt(req.params.id), organizationId: req.user.organizationId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Location not found' });
    }
    await prisma.location.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Location not found' });
    }
    res.status(500).json({ error: 'Failed to delete location' });
  }
});

export default router;
