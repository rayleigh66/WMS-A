import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    const [totalItems, inventoryBalances, lowStockItems, todayMovements] =
      await Promise.all([
        this.prisma.item.count({
          where: { status: "ACTIVE", deletedAt: null },
        }),
        this.prisma.inventoryBalance.findMany({ include: { item: true } }),
        this.prisma.item.count({
          where: {
            status: "ACTIVE",
            deletedAt: null,
            safetyStock: { gt: 0 },
          },
        }),
        this.prisma.stockMovement.findMany({
          where: { createdAt: { gte: todayStart } },
          select: { quantityChange: true, movementType: true },
        }),
      ]);

    const totalInventoryQuantity = inventoryBalances.reduce(
      (sum, b) => sum + Number(b.quantity),
      0,
    );

    // Count low stock items (where total inventory < safety_stock)
    const itemBalances: Record<string, { qty: number; safety: number }> = {};
    for (const b of inventoryBalances) {
      if (!itemBalances[b.itemId]) {
        itemBalances[b.itemId] = { qty: 0, safety: Number(b.item.safetyStock) };
      }
      itemBalances[b.itemId].qty += Number(b.quantity);
    }
    const lowStockCount = Object.values(itemBalances).filter(
      (v) => v.qty < v.safety && v.safety > 0,
    ).length;

    const todayStockInQty = todayMovements
      .filter((m) => m.movementType === "STOCK_IN")
      .reduce((sum, m) => sum + Number(m.quantityChange), 0);
    const todayStockOutQty = todayMovements
      .filter((m) => m.movementType === "STOCK_OUT")
      .reduce((sum, m) => sum + Math.abs(Number(m.quantityChange)), 0);

    const recentMovements = await this.prisma.stockMovement.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        item: { select: { itemCode: true, itemName: true } },
        warehouse: { select: { warehouseName: true } },
        operator: { select: { name: true } },
      },
    });

    return {
      totalItems,
      totalInventoryQuantity: String(totalInventoryQuantity),
      lowStockItems: lowStockCount,
      todayStockInQuantity: String(todayStockInQty),
      todayStockOutQuantity: String(todayStockOutQty),
      recentMovements,
    };
  }
}
