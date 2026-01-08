// DB
import { prisma } from "@/db";

// Errors
import { CustomerNotFoundError } from "@/errors";

// Validators
import {
  CreateCustomerInput,
  UpdateCustomerInput,
} from "@/validators/customer";

export class CustomerService {
  async createCustomer(data: CreateCustomerInput) {
    // Create customer
    const newCustomer = await prisma.customer.create({
      data: {
        name: data.name,
        lastName: data.lastName,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        zip: data.zip,
        country: data.country,
      },
    });

    return newCustomer;
  }

  async getCustomerById(id: string) {
    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new CustomerNotFoundError(id);
    }

    // Return customer
    return customer;
  }

  async getAllCustomers(limit?: number, skip?: number) {
    // Get total count
    const total = await prisma.customer.count();

    // Get all customers with pagination
    const customers = await prisma.customer.findMany({
      orderBy: {
        name: "asc",
      },
      take: limit,
      skip: skip,
    });

    return { customers, total };
  }

  async updateCustomer(id: string, data: UpdateCustomerInput) {
    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new CustomerNotFoundError(id);
    }

    // Update customer
    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data,
    });

    // Return customer
    return updatedCustomer;
  }

  async deleteCustomer(id: string) {
    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new CustomerNotFoundError(id);
    }

    // Delete customer
    await prisma.customer.delete({ where: { id } });
  }

  async getCustomersByName(name: string, limit?: number, skip?: number) {
    // Get total count for search
    const total = await prisma.customer.count({
      where: { name: { contains: name, mode: "insensitive" } },
    });

    // Get customers by name with pagination
    const customers = await prisma.customer.findMany({
      where: { name: { contains: name, mode: "insensitive" } },
      take: limit,
      skip: skip,
    });

    return { customers, total };
  }

  async getCustomersByPhone(phone: string) {
    // Get customers by phone
    const customers = await prisma.customer.findMany({
      where: { phone: { contains: phone, mode: "insensitive" } },
    });
  }
}

export const customerService = new CustomerService();
