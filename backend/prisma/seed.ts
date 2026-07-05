import { PrismaClient, Role, ItemCategory, Department } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'ChangeMe123!';
  const adminName = process.env.DEFAULT_ADMIN_NAME || 'Admin';

  // Create default admin user
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: adminName,
        role: Role.ADMIN,
        department: Department.ADMIN,
      },
    });
    console.log(`Created admin user: ${adminEmail}`);
  } else {
    console.log(`Admin user already exists: ${adminEmail}`);
  }

  // Create default viewer user
  const viewerEmail = 'viewer@example.com';
  const viewerExists = await prisma.user.findUnique({ where: { email: viewerEmail } });
  if (!viewerExists) {
    const passwordHash = await bcrypt.hash('Viewer123!', 10);
    await prisma.user.create({
      data: {
        email: viewerEmail,
        passwordHash,
        name: '张查看',
        role: Role.VIEWER,
        department: Department.OTHER,
      },
    });
    console.log(`Created viewer user: ${viewerEmail}`);
  }

  // Create warehouses
  const warehouses = [
    { warehouseCode: 'RAW-MAT', warehouseName: '原料仓' },
    { warehouseCode: 'HARDWARE', warehouseName: '五金仓' },
    { warehouseCode: 'ZIPPER', warehouseName: '拉链仓' },
    { warehouseCode: 'FINISHED', warehouseName: '成品仓' },
    { warehouseCode: 'DEFECT', warehouseName: '次品仓' },
  ];

  for (const wh of warehouses) {
    const existing = await prisma.warehouse.findUnique({ where: { warehouseCode: wh.warehouseCode } });
    if (!existing) {
      await prisma.warehouse.create({ data: wh });
      console.log(`Created warehouse: ${wh.warehouseCode}`);
    }
  }

  // Create default locations for each warehouse
  const allWarehouses = await prisma.warehouse.findMany({ where: { deletedAt: null } });
  for (const wh of allWarehouses) {
    const locCode = `${wh.warehouseCode}-DEFAULT`;
    const existing = await prisma.location.findUnique({
      where: { warehouseId_locationCode: { warehouseId: wh.id, locationCode: locCode } },
    });
    if (!existing) {
      await prisma.location.create({
        data: {
          locationCode: locCode,
          locationName: `${wh.warehouseName}默认库位`,
          warehouseId: wh.id,
        },
      });
      console.log(`Created location ${locCode} for warehouse ${wh.warehouseCode}`);
    }
  }

  // Create sample items (optional, clearly seed data)
  const sampleItems = [
    { itemCode: 'FAB-210D-BK', itemName: '210D 尼龙面料', category: ItemCategory.FABRIC, specification: '210D 高弹', color: '黑色', unit: '米', supplier: '广州中大布市', safetyStock: 500 },
    { itemCode: 'ZIP-005-BK', itemName: '5# 黑色尼龙拉链', category: ItemCategory.ZIPPER, specification: '5# 卷装拉链', color: '黑色', unit: '米', supplier: 'YKK深圳拉链厂', safetyStock: 1000 },
    { itemCode: 'THREAD-POLY-BK', itemName: '黑色涤纶缝纫线', category: ItemCategory.ACCESSORY, specification: '40/2 高强', color: '黑色', unit: '卷', supplier: '宁波缝纫线厂', safetyStock: 150 },
  ];

  for (const item of sampleItems) {
    const existing = await prisma.item.findUnique({ where: { itemCode: item.itemCode } });
    if (!existing) {
      await prisma.item.create({ data: item });
      console.log(`Created sample item: ${item.itemCode}`);
    }
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
