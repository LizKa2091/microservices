import { Order } from '../model/order';

const orders = new Map<string, Order>();

export const orderRepo = {
   async create(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'total'> & { items: any[] }) {
      const { v4: uuidv4 } = await import('uuid');
      const id = uuidv4();
      const now = new Date().toISOString();
      const total = (data.items || []).reduce((s: number, it: any) => s + it.price * it.quantity, 0);
      const order: Order = {
         id,
         userId: data.userId,
         items: data.items,
         status: 'created',
         total,
         createdAt: now,
         updatedAt: now
      };
      orders.set(id, order);
      return order;
   },
   async findById(id: string) {
      return orders.get(id) || null;
   },
   async listByUser(userId: string, { page = 1, limit = 10 }: { page?: number; limit?: number }) {
      const arr = Array.from(orders.values()).filter(o => o.userId === userId);
      const start = (page - 1) * limit;
      return { total: arr.length, items: arr.slice(start, start + limit) };
   },
   async updateStatus(id: string, status: Order['status']) {
      const ex = orders.get(id);
      if (!ex) return null;
      ex.status = status;
      ex.updatedAt = new Date().toISOString();
      orders.set(id, ex);
      return ex;
   },
   async delete(id: string) {
      return orders.delete(id);
   }
};