// src/auth/auth.service.ts
import { Injectable, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from '../../generated/prisma'; // adjust if needed

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  /* ---------- Helpers ---------- */

  private stringToRole(roleString: string): Role {
    const normalizedRole = roleString.toUpperCase() as keyof typeof Role;
    if (normalizedRole in Role) return Role[normalizedRole];
    throw new Error(`Invalid role: ${roleString}. Must be one of: ADMIN, CASHIER, STOCKKEEPER, MANAGER`);
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  async comparePassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  /* ---------- Core auth ---------- */

  // Validate the user during login
  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;

    const ok = await this.comparePassword(password, user.password);
    if (!ok) return null;

    return user; // includes id, email, role, etc.
  }

  // Sign access + refresh with different secrets/expiries
  private async getTokens(user: { id: number; email: string; role: Role }) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET_KEY || 'dev_access_secret',
        expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
        expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  // Store hashed refresh token
  private async updateRefreshTokenHash(userId: number, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: hash },
    });
  }

  // Invalidate refresh token
  async logout(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }

  // Login: issue tokens + persist hashed refresh token
  async login(user: any) {
    const tokens = await this.getTokens(user);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    // Controller will set the refresh token cookie; do NOT return it to client
    return {
      access_token: tokens.accessToken,
      // expose refreshToken ONLY to controller layer so it can set cookie:
      _internal_refresh: tokens.refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  // Refresh flow with rotation
  async refreshTokens(userId: number, incomingRefreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, refreshTokenHash: true },
    });
    if (!user || !user.refreshTokenHash) {
      throw new ForbiddenException('Access Denied');
    }

    const rtMatches = await bcrypt.compare(incomingRefreshToken, user.refreshTokenHash);
    if (!rtMatches) {
      throw new ForbiddenException('Access Denied');
    }

    const tokens = await this.getTokens(user);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    return {
      access_token: tokens.accessToken,
      role: user.role,
      _internal_refresh: tokens.refreshToken, // controller sets cookie
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  /* ---------- Registration ---------- */

  async register(createUserDto: CreateUserDto) {
    const { email, password, role, name, contact } = createUserDto;

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error('User already exists');

    const hashedPassword = await this.hashPassword(password);
    const roleEnum = typeof role === 'string' ? this.stringToRole(role) : role;

    const user = await this.prisma.user.create({
      data: {
        email,
        contact,
        password: hashedPassword,
        role: roleEnum,
        name,
      },
    });

    return user;
  }
}
