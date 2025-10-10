// import { Injectable } from '@nestjs/common';
// import { PrismaService } from 'src/prisma/prisma.service';
// import { NetProfitDto } from './dto/netprofit.dto';  // Import the NetProfitDto
// import { TopSellingItemDto } from './dto/top-selling-items.dto'; 

// @Injectable()
// export class InsightService {
//   constructor(private prisma: PrismaService) {}

//   async getTotalProducts(): Promise<number> {
//     try {
//       return await this.prisma.item.count();
//     } catch (error) {
//       throw new Error('Error fetching total products');
//     }
//   }

//   async getTotalSales(): Promise<number> {
//     try {
//       return await this.prisma.sale.count();
//     } catch (error) {
//       throw new Error('Error fetching total sales');
//     }
//   }

//   async getTotalCustomers(): Promise<number> {
//     try {
//       return await this.prisma.customer.count();
//     } catch (error) {
//       throw new Error('Error fetching total customers');
//     }
//   }

//   async getNetProfitForCurrentMonth(): Promise<NetProfitDto> {
//     const currentDate = new Date();
//     const currentMonth = currentDate.getMonth() + 1;

//     // Get total sales for the current month
//     const totalSales = await this.prisma.sale.aggregate({
//       _sum: {
//         total: true,
//       },
//       where: {
//         date: {
//           gte: new Date(currentDate.getFullYear(), currentMonth - 1, 1), // First day of the current month
//           lt: new Date(currentDate.getFullYear(), currentMonth, 1), // First day of next month
//         },
//       },
//     });

//     // Get total costs from supplier transactions for the current month
//     const totalCosts = await this.prisma.supplierTransaction.aggregate({
//       _sum: {
//         amount: true,
//       },
//       where: {
//         date: {
//           gte: new Date(currentDate.getFullYear(), currentMonth - 1, 1), // First day of the current month
//           lt: new Date(currentDate.getFullYear(), currentMonth, 1), // First day of next month
//         },
//       },
//     });

//     const netProfit = (totalSales._sum.total || 0) - (totalCosts._sum.amount || 0);

//     return {
//       totalSales: totalSales._sum.total || 0,
//       totalCosts: totalCosts._sum.amount || 0,
//       netProfit,
//       month: currentDate.toLocaleString('default', { month: 'long' }), // Get the name of the current month
//     };
//   }

//   async getTopSellingItems(): Promise<TopSellingItemDto[]> {
//   try {
//     const currentDate = new Date();
//     const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
//     const firstDayOfNextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

//     // Group invoices by itemId and sum the quantity
//     const grouped = await this.prisma.invoice.groupBy({
//       by: ['itemId'],
//       _sum: {
//         quantity: true,
//       },
//       where: {
//         saleInvoice: {
//           date: {
//             gte: firstDayOfMonth,
//             lt: firstDayOfNextMonth,
//           },
//         },
//       },
//       orderBy: {
//         _sum: {
//           quantity: 'desc',
//         },
//       },
//       take: 5,
//     });

//     // Fetch item info (name, sellPrice) and calculate revenue
//     const topSellingItems = await Promise.all(
//       grouped.map(async (g) => {
//         const item = await this.prisma.item.findUnique({
//           where: { id: g.itemId },
//           select: { name: true, stock: { select: { sellPrice: true }, take: 1 } }, 
//         });

//         // Use the most recent stock price (simplification — adjust if needed)
//         const sellPrice = item?.stock[0]?.sellPrice || 0;
//         const totalSold = g._sum.quantity || 0;
//         const totalRevenue = totalSold * sellPrice;

//         return {
//           name: item?.name || 'Unknown',
//           totalSold,
//           totalRevenue,
//         };
//       }),
//     );

//     return topSellingItems;
//   } catch (error) {
//     throw new Error('Error fetching top selling items: ' + error.message);
//   }
// }
// }