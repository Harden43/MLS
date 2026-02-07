import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';
import { config } from '../config';

interface TokenPayload {
  id: number;
  email: string;
  role: string;
}

// Simple in-memory token store (for production, use Redis or database)
const refreshTokenStore = new Map<number, string>();

export const authService = {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  },

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },

  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.jwt.secret, { expiresIn: '15m' });
  },

  generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.jwt.secret, { expiresIn: '7d' });
  },

  verifyToken(token: string): TokenPayload {
    return jwt.verify(token, config.jwt.secret) as TokenPayload;
  },

  async register(email: string, password: string, name?: string, role?: string, organizationName?: string) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('Email already registered');
    }
    if (!organizationName) {
      throw new Error('Organization name is required');
    }
    // Check if organization exists
    let organization = await prisma.organization.findUnique({ where: { name: organizationName } });
    if (organization) {
      throw new Error('Organization already exists');
    }
    // Create organization
    organization = await prisma.organization.create({
      data: {
        name: organizationName,
      },
    });

    const hashedPassword = await this.hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
        role: role || undefined,
        organizationId: organization.id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        organizationId: true,
      },
    });

    const tokenPayload = { id: user.id, email: user.email, role: user.role };
    const accessToken = this.generateAccessToken(tokenPayload);
    const refreshToken = this.generateRefreshToken(tokenPayload);

    // Store refresh token
    refreshTokenStore.set(user.id, refreshToken);

    return { user, accessToken, refreshToken };
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await this.comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const tokenPayload = { id: user.id, email: user.email, role: user.role };
    const accessToken = this.generateAccessToken(tokenPayload);
    const refreshToken = this.generateRefreshToken(tokenPayload);

    // Store refresh token
    refreshTokenStore.set(user.id, refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  },

  async refreshTokens(refreshToken: string) {
    const payload = this.verifyToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new Error('Invalid refresh token');
    }

    const storedToken = refreshTokenStore.get(user.id);
    if (storedToken !== refreshToken) {
      throw new Error('Invalid refresh token');
    }

    const tokenPayload = { id: user.id, email: user.email, role: user.role };
    const newAccessToken = this.generateAccessToken(tokenPayload);
    const newRefreshToken = this.generateRefreshToken(tokenPayload);

    refreshTokenStore.set(user.id, newRefreshToken);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  },

  async logout(userId: number) {
    refreshTokenStore.delete(userId);
  },
};
