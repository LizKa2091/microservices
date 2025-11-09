import { prisma } from '../prisma';

export class PrismaOrderRepo {
  async create(orderData: any) {
    return prisma.order.create({ data: orderData });
  }

  async findById(id: string) {
    return prisma.order.findUnique({ where: { id } });
  }

  async listByUser(userId: string, { page = 1, limit = 10 } = {}) {
    const skip = (page - 1) * limit;
    const items = await prisma.order.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    const total = await prisma.order.count({ where: { userId } });
    return { total, items };
  }

  async updateStatus(id: string, status: string) {
    return prisma.order.update({ where: { id }, data: { status } });
  }

  async delete(id: string) {
    return prisma.order.delete({ where: { id } });
  }
}