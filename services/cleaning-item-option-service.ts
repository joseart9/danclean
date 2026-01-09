// DB
import { prisma } from "@/db";

// Errors
import { CleaningItemOptionNotFoundError } from "@/errors";

// Validators
import {
  CreateCleaningItemOptionInput,
  UpdateCleaningItemOptionInput,
} from "@/validators/cleaning-item-option";

export class CleaningItemOptionService {
  async createCleaningItemOption(data: CreateCleaningItemOptionInput) {
    // Create cleaning item option
    const newCleaningItemOption = await prisma.cleaningItemOption.create({
      data: {
        name: data.name,
        price: data.price,
        toPrice: data.toPrice ?? null,
      },
    });

    return newCleaningItemOption;
  }

  async getCleaningItemOptionById(id: string) {
    // Check if cleaning item option exists
    const cleaningItemOption = await prisma.cleaningItemOption.findUnique({
      where: { id },
    });

    if (!cleaningItemOption) {
      throw new CleaningItemOptionNotFoundError(id);
    }

    // Return cleaning item option
    return cleaningItemOption;
  }

  async getAllCleaningItemOptions() {
    // Get all cleaning item options
    const cleaningItemOptions = await prisma.cleaningItemOption.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return cleaningItemOptions;
  }

  async updateCleaningItemOption(
    id: string,
    data: UpdateCleaningItemOptionInput
  ) {
    // Check if cleaning item option exists
    const cleaningItemOption = await prisma.cleaningItemOption.findUnique({
      where: { id },
    });

    if (!cleaningItemOption) {
      throw new CleaningItemOptionNotFoundError(id);
    }

    // Prepare update data, handling toPrice null case
    const updateData: {
      name?: string;
      price?: number;
      toPrice?: number | null;
    } = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.toPrice !== undefined) updateData.toPrice = data.toPrice ?? null;

    // Update cleaning item option
    const updatedCleaningItemOption = await prisma.cleaningItemOption.update({
      where: { id },
      data: updateData,
    });

    // Return cleaning item option
    return updatedCleaningItemOption;
  }

  async deleteCleaningItemOption(id: string) {
    // Check if cleaning item option exists
    const cleaningItemOption = await prisma.cleaningItemOption.findUnique({
      where: { id },
    });

    if (!cleaningItemOption) {
      throw new CleaningItemOptionNotFoundError(id);
    }

    // Delete cleaning item option
    await prisma.cleaningItemOption.delete({ where: { id } });
  }
}

export const cleaningItemOptionService = new CleaningItemOptionService();
