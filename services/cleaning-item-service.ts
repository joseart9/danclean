// DB
import { prisma } from "@/db";

// Errors
import { CleaningItemNotFoundError } from "@/errors";

// Validators
import {
  CreateCleaningItemInput,
  UpdateCleaningItemInput,
} from "@/validators/cleaning-item";

export class CleaningItemService {
  async createCleaningItem(data: CreateCleaningItemInput) {
    // Create cleaning item
    const newCleaningItem = await prisma.cleaningItem.create({
      data: {
        item_name: data.item_name,
        quantity: data.quantity,
        total: data.total,
      },
    });

    return newCleaningItem;
  }

  async getCleaningItemById(id: string) {
    // Check if cleaning item exists
    const cleaningItem = await prisma.cleaningItem.findUnique({
      where: { id },
    });

    if (!cleaningItem) {
      throw new CleaningItemNotFoundError(id);
    }

    // Return cleaning item
    return cleaningItem;
  }

  async getAllCleaningItems() {
    // Get all cleaning items
    const cleaningItems = await prisma.cleaningItem.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return cleaningItems;
  }

  async updateCleaningItem(id: string, data: UpdateCleaningItemInput) {
    // Check if cleaning item exists
    const cleaningItem = await prisma.cleaningItem.findUnique({
      where: { id },
    });

    if (!cleaningItem) {
      throw new CleaningItemNotFoundError(id);
    }

    // Update cleaning item
    const updatedCleaningItem = await prisma.cleaningItem.update({
      where: { id },
      data,
    });

    // Return cleaning item
    return updatedCleaningItem;
  }

  async deleteCleaningItem(id: string) {
    // Check if cleaning item exists
    const cleaningItem = await prisma.cleaningItem.findUnique({
      where: { id },
    });

    if (!cleaningItem) {
      throw new CleaningItemNotFoundError(id);
    }

    // Delete cleaning item
    await prisma.cleaningItem.delete({ where: { id } });
  }
}

export const cleaningItemService = new CleaningItemService();
