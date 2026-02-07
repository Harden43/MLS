import { Router } from 'express';
import { prisma } from '../services/prisma';

const router = Router();

// Get all returns
router.get('/', authorize('ADMIN', 'USER'), async (req, res) => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status) where.status = String(status);
    const returns = await prisma.return.findMany({
      where,
      include: {
        customer: true,
        salesOrder: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: returns });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch returns' });
  }
});

// Get return by ID
router.get('/:id', authorize('ADMIN', 'USER'), async (req, res) => {
  try {
    const ret = await prisma.return.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        customer: true,
        salesOrder: true,
        items: { include: { product: true } },
      },
    });
    if (!ret) return res.status(404).json({ error: 'Return not found' });
    res.json({ data: ret });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch return' });
  }
});

// Create return
router.post('/', authorize('ADMIN', 'USER'), async (req, res) => {
  try {
    const { customerId, salesOrderId, items, reason, notes } = req.body;
    if (!customerId || !items?.length) {
      return res.status(400).json({ error: 'Customer and at least one item are required' });
    }

    // Generate return number
    const lastReturn = await prisma.return.findFirst({ orderBy: { id: 'desc' } });
    const retNum = lastReturn ? parseInt(lastReturn.returnNumber.replace('RET-', '')) + 1 : 1;
    const returnNumber = `RET-${String(retNum).padStart(5, '0')}`;

    const returnItems = items.map((item: any) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      condition: item.condition,
      reason: item.reason,
    }));

    const subtotal = returnItems.reduce((sum: number, item: any) => sum + item.quantity * item.unitPrice, 0);

    const ret = await prisma.return.create({
      data: {
        returnNumber,
        customerId,
        salesOrderId,
        reason,
        notes,
        subtotal,
        refundAmount: subtotal,
        createdBy: (req as any).user?.id,
        items: { create: returnItems },
      },
      include: { customer: true, items: { include: { product: true } } },
    });

    res.status(201).json({ data: ret });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create return' });
  }
});

// Update return status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const id = parseInt(req.params.id);
    const validStatuses = ['pending', 'approved', 'received', 'rejected', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const ret = await prisma.return.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!ret) return res.status(404).json({ error: 'Return not found' });

    // When received, add stock back
    if (status === 'received' && ret.status !== 'received') {
      for (const item of ret.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
        await prisma.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: 'in',
            reference: ret.returnNumber,
            notes: `Return ${ret.returnNumber} received`,
            userId: (req as any).user?.id,
          },
        });
      }
    }

    const updateData: any = { status };
    if (status === 'received' || status === 'refunded') updateData.processedAt = new Date();

    const updated = await prisma.return.update({
      where: { id },
      data: updateData,
      include: { customer: true, items: { include: { product: true } } },
    });

    res.json({ data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update return status' });
  }
});

// Delete return
router.delete('/:id', async (req, res) => {
  try {
    const ret = await prisma.return.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!ret) return res.status(404).json({ error: 'Return not found' });
    if (ret.status !== 'pending') {
      return res.status(400).json({ error: 'Can only delete pending returns' });
    }
    await prisma.return.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Return deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete return' });
  }
});

export default router;
