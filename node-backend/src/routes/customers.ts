import { Router } from 'express';
import { prisma } from '../services/prisma';

const router = Router();

// Get all customers
router.get('/', authorize('ADMIN', 'USER'), async (req, res) => {
  try {
    const { search } = req.query;
    const where: any = { organizationId: req.user.organizationId };
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
        { code: { contains: String(search), mode: 'insensitive' } },
      ];
    }
    const customers = await prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { salesOrders: true, returns: true } },
      },
    });
    res.json({ data: customers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get customer by ID
router.get('/:id', authorize('ADMIN', 'USER'), async (req, res) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: { id: parseInt(req.params.id), organizationId: req.user.organizationId },
      include: {
        salesOrders: { take: 10, orderBy: { createdAt: 'desc' } },
        returns: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json({ data: customer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// Create customer
router.post('/', authorize('ADMIN', 'USER'), async (req, res) => {
  try {
    const { name, code, email, phone, address, city, state, zipCode, country, contactName, creditLimit, paymentTerms, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const customer = await prisma.customer.create({
      data: { name, code, email, phone, address, city, state, zipCode, country, contactName, creditLimit, paymentTerms, notes, organizationId: req.user.organizationId },
    });
    res.status(201).json({ data: customer });
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(409).json({ error: 'Customer code already exists' });
    console.error(error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Update customer
router.put('/:id', async (req, res) => {
  try {
    const customer = await prisma.customer.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    res.json({ data: customer });
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(409).json({ error: 'Customer code already exists' });
    if (error.code === 'P2025') return res.status(404).json({ error: 'Customer not found' });
    console.error(error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    await prisma.customer.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Customer deleted' });
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Customer not found' });
    console.error(error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

export default router;
