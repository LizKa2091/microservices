export type OrderStatus = 'created' | 'in_progress' | 'done' | 'cancelled';

export interface OrderItem {
   productId: string;
   name?: string;
   quantity: number;
   price: number;
}

export interface Order {
   id: string;
   userId: string;
   items: OrderItem[];
   status: OrderStatus;
   total: number;
   createdAt: string;
   updatedAt: string;
}