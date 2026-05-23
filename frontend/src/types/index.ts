export type ReservationStatus = "PENDING" | "CONFIRMED" | "RELEASED";

export type Warehouse = {
  id: string;
  name: string;
  location: string;
  createdAt: string;
  updatedAt: string;
};

export type InventoryWithStock = {
  id: string;
  productId: string;
  warehouseId: string;
  totalStock: number;
  reservedStock: number;
  availableStock: number;
  createdAt: string;
  updatedAt: string;
  warehouse: Warehouse;
};

export type ProductWithStock = {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  price: number;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  inventories: InventoryWithStock[];
};

export type ReservationWithDetails = {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  status: ReservationStatus;
  expiresAt: string;
  idempotencyKey: string | null;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    description: string | null;
    sku: string;
    price: number;
    imageUrl: string | null;
    createdAt: string;
    updatedAt: string;
  };
  warehouse: Warehouse;
};

export type CreateReservationInput = {
  productId: string;
  warehouseId: string;
  quantity: number;
  idempotencyKey?: string;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiErrorBody = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};
