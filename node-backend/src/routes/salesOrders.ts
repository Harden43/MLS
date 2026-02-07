import { Router } from 'express';
import { prisma } from '../services/prisma';

const router = Router();

// Get all sales orders
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status) where.status = String(status);

    const orders = await prisma.salesOrder.findMany({
      where,
      include: {
        customer: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch sales orders' });
  }
});

// Get sales order by ID
router.get('/:id', async (req, res) => {
  try {
    const order = await prisma.salesOrder.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });
    if (!order) return res.status(404).json({ error: 'Sales order not found' });
    res.json({ data: order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch sales order' });
  }
});

// Create sales order
router.post('/', async (req, res) => {
  try {
    const { customerId, items, notes, shippingAddress } = req.body;
    if (!customerId || !items?.length) {
      return res.status(400).json({ error: 'Customer and at least one item are required' });
    }

    // Generate order number
    const lastOrder = await prisma.salesOrder.findFirst({ orderBy: { id: 'desc' } });
    const orderNum = lastOrder ? parseInt(lastOrder.orderNumber.replace('SO-', '')) + 1 : 1;
    const orderNumber = `SO-${String(orderNum).padStart(5, '0')}`;

    // Calculate totals
    const orderItems = items.map((item: any) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount || 0,
      total: item.quantity * item.unitPrice - (item.discount || 0),
    }));

    const subtotal = orderItems.reduce((sum: number, item: any) => sum + item.total, 0);
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    const order = await prisma.salesOrder.create({
      data: {
        orderNumber,
        customerId,
        subtotal,
        tax,
        total,
        notes,
        shippingAddress,
        createdBy: (req as any).user?.id,
        items: { create: orderItems },
      },
      include: { customer: true, items: { include: { product: true } } },
    });

    res.status(201).json({ data: order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create sales order' });
  }
});

// Update sales order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const id = parseInt(req.params.id);
    const validStatuses = ['draft', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await prisma.salesOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) return res.status(404).json({ error: 'Sales order not found' });

    // When processing, deduct stock
    if (status === 'processing' && order.status !== 'processing') {
      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
        await prisma.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: 'out',
            reference: order.orderNumber,
            notes: `Sales order ${order.orderNumber}`,
            userId: (req as any).user?.id,
          },
        });
      }
    }

    // When cancelled (from processing), restore stock
    if (status === 'cancelled' && order.status === 'processing') {
      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
        await prisma.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: 'in',
            reference: order.orderNumber,
            notes: `Cancelled sales order ${order.orderNumber}`,
            userId: (req as any).user?.id,
          },
        });
      }
    }

    const updateData: any = { status };
    if (status === 'shipped') updateData.shippingDate = new Date();
    if (status === 'delivered') updateData.deliveryDate = new Date();

    const updated = await prisma.salesOrder.update({
      where: { id },
      data: updateData,
      include: { customer: true, items: { include: { product: true } } },
    });

    res.json({ data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update sales order status' });
  }
});

// Delete sales order
router.delete('/:id', async (req, res) => {
  try {
    const order = await prisma.salesOrder.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!order) return res.status(404).json({ error: 'Sales order not found' });
    if (order.status !== 'draft') {
      return res.status(400).json({ error: 'Can only delete draft orders' });
    }
    await prisma.salesOrder.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Sales order deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete sales order' });
  }
});

export default router;
