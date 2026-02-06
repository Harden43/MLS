import { Router } from 'express';
import { prisma } from '../services/prisma';
import { validate } from '../middleware/validate';
import { authorize } from '../middleware/auth';
import { createPurchaseOrderSchema, updateOrderStatusSchema, receiveOrderSchema, idParamSchema } from '../schemas/common.schema';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const orders = await prisma.purchaseOrder.findMany({
      include: { supplier: true, items: { include: { product: true } }, _count: { select: { items: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ data: orders });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

router.get('/:id', validate(idParamSchema), async (req, res) => {
  try {
    const order = await prisma.purchaseOrder.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { supplier: true, items: { include: { product: true } } }
    });
    if (!order) return res.status(404).json({ error: 'Purchase order not found' });
    res.json({ data: order });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch purchase order' });
  }
});

router.post('/', authorize('ADMIN', 'USER'), validate(createPurchaseOrderSchema), async (req, res) => {
  try {
    const { supplierId, items, notes, expectedDate } = req.body;
    const count = await prisma.purchaseOrder.count();
    const orderNumber = 'PO-' + String(count + 1).padStart(5, '0');
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    const order = await prisma.purchaseOrder.create({
      data: {
        orderNumber, supplierId, notes, expectedDate: expectedDate ? new Date(expectedDate) : null,
        subtotal, tax, total, createdBy: req.user?.id,
        items: { create: items.map((item: any) => ({ productId: item.productId, quantity: item.quantity, unitPrice: item.unitPrice, total: item.quantity * item.unitPrice })) }
      },
      include: { items: true, supplier: true }
    });
    res.status(201).json({ data: order });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
});

router.patch('/:id/status', authorize('ADMIN', 'USER'), validate(updateOrderStatusSchema), async (req, res) => {
  try {
    const { status } = req.body;
    const order = await prisma.purchaseOrder.update({
      where: { id: parseInt(req.params.id) },
      data: { status, approvedBy: status === 'approved' ? req.user?.id : undefined }
    });
    res.json({ data: order });
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Not found' });
    res.status(500).json({ error: 'Failed to update status' });
  }
});

router.post('/:id/receive', authorize('ADMIN', 'USER'), validate(receiveOrderSchema), async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { items } = req.body;

    for (const item of items) {
      await prisma.purchaseOrderItem.update({ where: { id: item.itemId }, data: { receivedQty: { increment: item.receivedQty } } });
      const orderItem = await prisma.purchaseOrderItem.findUnique({ where: { id: item.itemId } });
      if (orderItem) {
        await prisma.product.update({ where: { id: orderItem.productId }, data: { stock: { increment: item.receivedQty } } });
        await prisma.stockMovement.create({ data: { productId: orderItem.productId, quantity: item.receivedQty, movementType: 'in', reference: 'PO-' + orderId, notes: 'Received from PO', userId: req.user?.id } });
      }
    }

    const order = await prisma.purchaseOrder.findUnique({ where: { id: orderId }, include: { items: true } });
    const allReceived = order?.items.every(item => item.receivedQty >= item.quantity);
    const someReceived = order?.items.some(item => item.receivedQty > 0);

    await prisma.purchaseOrder.update({
      where: { id: orderId },
      data: { status: allReceived ? 'received' : (someReceived ? 'partial' : order?.status), receivedDate: allReceived ? new Date() : null }
    });
    res.json({ data: order });
  } catch (error) {
    res.status(500).json({ error: 'Failed to receive' });
  }
});

router.delete('/:id', authorize('ADMIN'), validate(idParamSchema), async (req, res) => {
  try {
    await prisma.purchaseOrder.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Not found' });
    res.status(500).json({ error: 'Failed to delete' });
  }
});

export default router;
