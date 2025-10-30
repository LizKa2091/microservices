export type UserRole = 'user' | 'admin';

export interface User {
   id: string;
   email: string;
   passwordHash: string;
   name: string;
   roles: UserRole[];
   createdAt: string;
   updatedAt: string;
}