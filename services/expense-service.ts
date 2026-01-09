// DB
import { prisma } from "@/db";

// Errors
import { ExpenseNotFoundError } from "@/errors";

// Validators
import { CreateExpenseInput, UpdateExpenseInput } from "@/validators/expense";

// Context
import { getUserId } from "@/lib/auth";

// Utils
import { dateStringToUTCRange } from "@/utils/timezone";

export class ExpenseService {
  async createExpense(data: CreateExpenseInput) {
    // Get user ID
    const userId = await getUserId();

    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Create expense
    const newExpense = await prisma.expense.create({
      data: {
        name: data.name,
        amount: data.amount,
        userId: userId,
        timestamp: data.timestamp,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return newExpense;
  }

  async getExpenseById(id: string) {
    // Check if expense exists
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!expense) {
      throw new ExpenseNotFoundError(id);
    }

    // Return expense
    return expense;
  }

  async getAllExpenses(from: Date, to: Date) {
    // Get all expenses
    const expenses = await prisma.expense.findMany({
      where: {
        timestamp: {
          gte: from,
          lte: to,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    return expenses;
  }

  async updateExpense(id: string, data: UpdateExpenseInput) {
    // Check if expense exists
    const expense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      throw new ExpenseNotFoundError(id);
    }

    // Update expense
    const updatedExpense = await prisma.expense.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Return expense
    return updatedExpense;
  }

  async deleteExpense(id: string) {
    // Check if expense exists
    const expense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      throw new ExpenseNotFoundError(id);
    }

    // Delete expense
    await prisma.expense.delete({ where: { id } });
  }
}

export const expenseService = new ExpenseService();
