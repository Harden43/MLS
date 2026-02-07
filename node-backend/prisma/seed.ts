import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create categories
  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Electronics', description: 'Devices and gadgets' } }),
    prisma.category.create({ data: { name: 'Groceries', description: 'Food and household items' } }),
    prisma.category.create({ data: { name: 'Office Supplies', description: 'Stationery and office equipment' } }),
    prisma.category.create({ data: { name: 'Furniture', description: 'Home and office furniture' } }),
    prisma.category.create({ data: { name: 'Clothing', description: 'Apparel and accessories' } }),
  ]);

  // Create suppliers
  const suppliers = await Promise.all([
    prisma.supplier.create({ data: { name: 'TechSource Ltd.', email: 'contact@techsource.com', phone: '800-555-0101', address: '101 Silicon Ave, San Francisco, CA', code: 'TS001', leadTimeDays: 5, paymentTerms: 'Net 30' } }),
    prisma.supplier.create({ data: { name: 'FreshFoods Inc.', email: 'sales@freshfoods.com', phone: '800-555-0202', address: '202 Market St, New York, NY', code: 'FF002', leadTimeDays: 2, paymentTerms: 'Net 15' } }),
    prisma.supplier.create({ data: { name: 'OfficeMart', email: 'info@officemart.com', phone: '800-555-0303', address: '303 Business Rd, Chicago, IL', code: 'OM003', leadTimeDays: 7, paymentTerms: 'Net 45' } }),
    prisma.supplier.create({ data: { name: 'FurniWorld', email: 'support@furniworld.com', phone: '800-555-0404', address: '404 Comfort Ln, Dallas, TX', code: 'FW004', leadTimeDays: 10, paymentTerms: 'Net 60' } }),
    prisma.supplier.create({ data: { name: 'StyleHub', email: 'hello@stylehub.com', phone: '800-555-0505', address: '505 Fashion Blvd, Los Angeles, CA', code: 'SH005', leadTimeDays: 3, paymentTerms: 'Net 30' } }),
  ]);

  // Create products
  await Promise.all([
    prisma.product.create({
      data: {
        name: 'iPhone 14 Pro', sku: 'ELEC-1001', stock: 25, price: 1099.99, description: 'Apple smartphone', categoryId: categories[0].id, supplierId: suppliers[0].id, barcode: '1111111111111', cost: 950, unit: 'pcs', minStock: 5, maxStock: 50, reorderPoint: 10,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Samsung 55" TV', sku: 'ELEC-1002', stock: 10, price: 699.99, description: 'Smart LED TV', categoryId: categories[0].id, supplierId: suppliers[0].id, barcode: '2222222222222', cost: 600, unit: 'pcs', minStock: 2, maxStock: 20, reorderPoint: 5,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Organic Brown Rice', sku: 'GROC-2001', stock: 100, price: 3.49, description: '5kg pack', categoryId: categories[1].id, supplierId: suppliers[1].id, barcode: '3333333333333', cost: 2.5, unit: 'kg', minStock: 20, maxStock: 200, reorderPoint: 40,
      },
    }),
    prisma.product.create({
      data: {
        name: 'A4 Copy Paper', sku: 'OFF-3001', stock: 500, price: 5.99, description: '500 sheets', categoryId: categories[2].id, supplierId: suppliers[2].id, barcode: '4444444444444', cost: 4.5, unit: 'pack', minStock: 100, maxStock: 1000, reorderPoint: 200,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Ergonomic Chair', sku: 'FURN-4001', stock: 15, price: 149.99, description: 'Mesh back office chair', categoryId: categories[3].id, supplierId: suppliers[3].id, barcode: '5555555555555', cost: 120, unit: 'pcs', minStock: 3, maxStock: 30, reorderPoint: 6,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Men’s Polo Shirt', sku: 'CLOTH-5001', stock: 60, price: 19.99, description: 'Cotton, assorted colors', categoryId: categories[4].id, supplierId: suppliers[4].id, barcode: '6666666666666', cost: 12, unit: 'pcs', minStock: 10, maxStock: 100, reorderPoint: 20,
      },
    }),
  ]);

  // Create customers
  await Promise.all([
    prisma.customer.create({
      data: {
        name: 'Acme Corp', code: 'AC001', email: 'orders@acmecorp.com', phone: '800-555-0606', address: '606 Industrial Pkwy, Houston, TX', city: 'Houston', state: 'TX', zipCode: '77001', country: 'USA', contactName: 'Jane Smith', creditLimit: 5000,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Green Valley Market', code: 'GVM002', email: 'info@greenvalleymarket.com', phone: '800-555-0707', address: '707 Farm Rd, Denver, CO', city: 'Denver', state: 'CO', zipCode: '80201', country: 'USA', contactName: 'John Doe', creditLimit: 2000,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Sunrise Office Solutions', code: 'SOS003', email: 'contact@sunriseoffice.com', phone: '800-555-0808', address: '808 Sunrise Blvd, Miami, FL', city: 'Miami', state: 'FL', zipCode: '33101', country: 'USA', contactName: 'Emily Clark', creditLimit: 3000,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Fashion Boutique', code: 'FB004', email: 'hello@fashionboutique.com', phone: '800-555-0909', address: '909 Style St, Seattle, WA', city: 'Seattle', state: 'WA', zipCode: '98101', country: 'USA', contactName: 'Michael Lee', creditLimit: 1500,
      },
    }),
  ]);
}

main()
  .then(() => {
    console.log('Dummy data seeded successfully');
    prisma.$disconnect();
  })
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
