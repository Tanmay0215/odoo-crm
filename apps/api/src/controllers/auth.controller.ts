import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";

import { db } from "../db/index.js";
import { users } from "../db/schema/users.js";
import { LoginSchema, RegisterSchema } from "@repo/schemas";
import { BadRequestError, UnauthorizedError } from "../utils/app-error.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { env } from "../config/env.config.js";

export const register = async (req: Request, res: Response): Promise<void> => {
  const parseResult = RegisterSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new BadRequestError(
      parseResult.error.errors[0]?.message || "Validation failed",
    );
  }

  const { name, email, password, role } = parseResult.data;

  // Check if user already exists
  const existingUsers = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()));
  if (existingUsers.length > 0) {
    throw new BadRequestError("This email address is already registered");
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  const [newUser] = await db
    .insert(users)
    .values({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
    })
    .returning();

  if (!newUser) {
    throw new BadRequestError("Failed to create user account");
  }

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    },
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const parseResult = LoginSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new BadRequestError(
      parseResult.error.errors[0]?.message || "Validation failed",
    );
  }

  const { email, password } = parseResult.data;

  // Find user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()));
  if (!user) {
    throw new UnauthorizedError("Invalid email or password credentials");
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new UnauthorizedError("Invalid email or password credentials");
  }

  // Sign JWT
  const token = jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] },
  );

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  });
};

export const getMe = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError("User context not established");
  }

  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
};
