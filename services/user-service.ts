import bcrypt from "bcrypt";

// DB
import { prisma } from "@/db";

// Errors
import {
  InvalidCredentialsError,
  UserAlreadyExistsError,
  UserNotFoundError,
} from "@/errors";

// Validators
import {
  CreateUserInput,
  LoginUserInput,
  UpdateUserInput,
} from "@/validators/user";

// Jwt
import jwt from "jsonwebtoken";

// Types
import { User } from "@/generated/prisma/client";

export class UserService {
  async generateToken(user: User) {
    if (!process.env.AUTH_SECRET) {
      throw new Error("JWT_SECRET is not set");
    }
    const userSession = {
      userId: user.id,
    };
    return jwt.sign({ userSession }, process.env.AUTH_SECRET, {
      expiresIn: "7d",
    });
  }

  async createUser(data: CreateUserInput) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new UserAlreadyExistsError();
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        lastName: data.lastName ?? "",
        role: data.role,
      },
    });

    return newUser;
  }

  async loginUser(data: LoginUserInput) {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new UserNotFoundError();
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    // Generate token
    const token = await this.generateToken(user);

    // Return token
    return token;
  }

  async getAllUsers() {
    // Get all users (excluding passwords)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return users;
  }

  async getUserById(id: string) {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UserNotFoundError();
    }

    // Return user
    return user;
  }

  async updateUser(id: string, data: UpdateUserInput) {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new UserNotFoundError();
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data,
    });

    // Return user
    return updatedUser;
  }

  async deleteUser(id: string) {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new UserNotFoundError();
    }

    // Delete user
    await prisma.user.delete({ where: { id } });
  }
}

export const userService = new UserService();
