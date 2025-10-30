import { User } from '../models/user';

const users = new Map<string, User>();

export const userRepo = {
   async create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
      const { v4: uuidv4 } = await import('uuid');
      const id = uuidv4();
      const now = new Date().toISOString();
      const user: User = { id, ...data, createdAt: now, updatedAt: now };

      users.set(id, user);

      return user;
   },

   async findByEmail(email: string) {
      for (const u of users.values()) {
         if (u.email.toLowerCase() === email.toLowerCase()) return u;
      }

      return null;
   },

   async findById(id: string) {
      return users.get(id) || null;
   },

   async update(id: string, patch: Partial<User>) {
      const existing = users.get(id);

      if (!existing) return null;

      const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
      users.set(id, updated);

      return updated;
   },

   async list({ page = 1, limit = 10, filterEmail }: { page?: number; limit?: number; filterEmail?: string }) {
      let arr = Array.from(users.values());

      if (filterEmail) {
         arr = arr.filter(u => u.email.includes(filterEmail));
      }

      const start = (page - 1) * limit;
      const data = arr.slice(start, start + limit);
      
      return { total: arr.length, items: data };
   }
};