import { Customer } from "./customer";
import { User } from "@/generated/prisma/browser";

export enum OrderType {
  IRONING = "IRONING",
  CLEANING = "CLEANING",
}

interface IroningItem {
  id: string;
  quantity: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CleaningItem {
  id: string;
  item_name: string;
  quantity: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum OrderPaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  PARTIALLY_PAID = "PARTIALLY_PAID",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
}

export enum OrderPaymentMethod {
  CASH = "CASH",
  CARD = "CARD",
  TRANSFER = "TRANSFER",
}

export enum OrderStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  DAMAGED = "DAMAGED",
  LOST = "LOST",
  DELIVERED = "DELIVERED",
}

export interface Storage {
  id: string;
  storageNumber: number;
  totalCapacity: number;
  usedCapacity: number;
  fromNumberRange: number;
  toNumberRange: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  type: OrderType;
  customerId: string;
  paymentStatus: OrderPaymentStatus;
  paymentMethod: OrderPaymentMethod;
  status: OrderStatus;
  total: number;
  totalPaid: number;
  orderNumber: number;
  storageId: string | null;
  mainOrderId: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FullOrder extends Order {
  customer: Customer;
  storage: Storage | null;
  mainOrder: Order | null;
  orderHistory: Order[];
  items: IroningItem | CleaningItem[];
  user: User;
}
