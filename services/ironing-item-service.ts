// DB
import { prisma } from "@/db";

// Errors
import { IroningItemNotFoundError } from "@/errors";

// Validators
import {
  CreateIroningItemInput,
  UpdateIroningItemInput,
} from "@/validators/ironing-item";

export class IroningItemService {
  async createIroningItem(data: CreateIroningItemInput) {
    // Create ironing item
    const newIroningItem = await prisma.ironingItem.create({
      data: {
        quantity: data.quantity,
        total: data.total,
      },
    });

    return newIroningItem;
  }

  async getIroningItemById(id: string) {
    // Check if ironing item exists
    const ironingItem = await prisma.ironingItem.findUnique({
      where: { id },
    });

    if (!ironingItem) {
      throw new IroningItemNotFoundError(id);
    }

    // Return ironing item
    return ironingItem;
  }

  async getAllIroningItems() {
    // Get all ironing items
    const ironingItems = await prisma.ironingItem.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return ironingItems;
  }

  async updateIroningItem(id: string, data: UpdateIroningItemInput) {
    // Check if ironing item exists
    const ironingItem = await prisma.ironingItem.findUnique({
      where: { id },
    });

    if (!ironingItem) {
      throw new IroningItemNotFoundError(id);
    }

    // Update ironing item
    const updatedIroningItem = await prisma.ironingItem.update({
      where: { id },
      data,
    });

    // Return ironing item
    return updatedIroningItem;
  }

  async deleteIroningItem(id: string) {
    // Check if ironing item exists
    const ironingItem = await prisma.ironingItem.findUnique({
      where: { id },
    });

    if (!ironingItem) {
      throw new IroningItemNotFoundError(id);
    }

    // Delete ironing item
    await prisma.ironingItem.delete({ where: { id } });
  }
}

export const ironingItemService = new IroningItemService();
