import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const userRepo = {
   async create(data: any) {
      return prisma.user.create({ data });
   },

   async findByEmail(email: string) {
      return prisma.user.findUnique({ where: { email } });
   },

   async findById(id: string) {
      return prisma.user.findUnique({ where: { id } });
   },

   async update(id: string, data: any) {
      return prisma.user.update({ where: { id }, data });
   },

   async list(params: { page: number; limit: number; filterEmail?: string }) {
      const { page, limit, filterEmail } = params;
      const where = filterEmail ? { email: { contains: filterEmail } } : {};
      const users = await prisma.user.findMany({
         where,
         skip: (page - 1) * limit,
         take: limit,
      });
      const total = await prisma.user.count({ where });
      return { users, total, page, limit };
   },
};
