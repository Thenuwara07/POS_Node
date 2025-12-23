// src/auth/strategies/jwt-access.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET_KEY || 'dev_access_secret',
    });
  }

  async validate(payload: any) {
    // ✅ Enforce user existence + active status on every request
    const userId = Number(payload?.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, email: true, name: true, status: true },
    });

    if (!user) throw new UnauthorizedException('User not found');
    if ((user as any).status === false) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // controllers use req.user.sub
    return {
      sub: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    };
  }
}
