// src/auth/auth.service.ts
import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from '@prisma/client';


@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  // Hash the password before storing in the database
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  // Compare plaintext password with the hashed password
  async comparePassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  // Validate user with email and password
  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;

    const ok = await this.comparePassword(password, user.password);
    if (!ok) return null;

    // Return user without password
    const { password: _, ...result } = user;
    return result;
  }

  // Generate JWT tokens (access & refresh)
  private async getTokens(user: { id: number; role: any }) { // Use 'any' for role temporarily
  const payload = { 
    sub: user.id, 
    role: user.role as Role // Explicit cast
  };

  const [accessToken, refreshToken] = await Promise.all([
    this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET_KEY || 'dev_access_secret',
      expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
    }),
    this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
      expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
    }),
  ]);

  return { accessToken, refreshToken };
}


  // Store hashed refresh token in the database
  private async updateRefreshTokenHash(userId: number, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: hash },
    });
  }

  // Logout and clear refresh token hash
  async logout(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }

  // User login method: returns access and refresh tokens
  async login(user: any) {
  const tokens = await this.getTokens(user);
  await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

  return {
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    user: { 
      id: user.id, 
      email: user.email, 
      role: user.role as Role, // Explicit cast
      name: user.name 
    },
  };
}

  // Refresh tokens for user
  async refreshTokens(userId: number, incomingRefreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.refreshTokenHash) {
      throw new ForbiddenException('Access Denied');
    }

    const rtMatches = await bcrypt.compare(
      incomingRefreshToken,
      user.refreshTokenHash,
    );
    if (!rtMatches) {
      throw new ForbiddenException('Access Denied');
    }

    const tokens = await this.getTokens(user);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      user: { id: user.id, email: user.email, role: user.role, name: user.name },
    };
  }

  // Register a new user
  // Register a new user
async register(createUserDto: CreateUserDto) {
  const { email, password, role, name, contact } = createUserDto;

  const existing = await this.prisma.user.findUnique({ where: { email } });
  if (existing) throw new ConflictException('User already exists');

  const hashedPassword = await this.hashPassword(password);

  // Normalize the role case to "Stockkeeper"
  const normalizedRole = role ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() : 'Stockkeeper';

  // Create the user data with proper role handling
  const userData: any = {
    email,
    contact,
    password: hashedPassword,
    name,
    role: normalizedRole,
  };

  const user = await this.prisma.user.create({
    data: userData,
    select: {
      id: true,
      email: true,
      name: true,
      contact: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    }
  });

  return user;
}

}