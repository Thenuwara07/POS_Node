// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from '../prisma/prisma.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

@Module({
  imports: [
    // Load env vars globally (JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, etc.)
    ConfigModule.forRoot({ isGlobal: true }),

    // We won’t set secret/expiry here; we’ll sign per-call in AuthService
    JwtModule.register({}),

    // Needed for @UseGuards(AuthGuard('jwt')) etc.
    PassportModule.register({ defaultStrategy: 'jwt' }),

    PrismaModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAccessStrategy, JwtRefreshStrategy],
})
export class AuthModule {}
