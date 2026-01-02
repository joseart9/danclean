import { OrderType } from "@/types/order";
import { CreateOrderInput } from "@/validators/order";

/**
 * Calculates the total garment count for an order
 * @param data - Order creation data
 * @returns Total number of garments
 */
export const calculateGarmentCount = (data: CreateOrderInput): number => {
  if (data.type === OrderType.IRONING) {
    return data.items.quantity;
  } else if (data.type === OrderType.CLEANING) {
    return data.items.reduce((total, item) => total + item.quantity, 0);
  }
  return 0;
};
