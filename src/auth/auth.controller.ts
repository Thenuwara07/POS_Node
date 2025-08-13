// src/auth/auth.controller.ts
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
// 👇 type-only imports fix the error
import type { Response, Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto'; 

function parseRefreshTokenTTL(raw: string): number {
  // Simple parse for numeric values (milliseconds)
  if (/^\d+$/.test(raw)) return parseInt(raw, 10);
  
  // Parse values with units (e.g., "7d", "1h")
  const match = /^(\d+)([smhd])$/.exec(raw);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // Default 7 days
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  const multipliers = {
    s: 1000,
    m: 60000,
    h: 3600000,
    d: 86400000
  };
  
  return value * (multipliers[unit as keyof typeof multipliers] || 86400000);
}

function refreshCookieOptions(): {
    httpOnly: boolean;
    secure: boolean;
    sameSite: boolean | 'lax' | 'strict' | 'none';
    domain?: string;
    path: string;
    maxAge: number;
}{
    const secure = String(process.env.COOKIE_SECURE || '').toLowerCase() === 'true';
    const domain = process.env.COOKIE_DOMAIN || undefined;
    const raw = process.env.JWT_REFRESH_EXPIRES || '7d';
  
  return {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax', // Properly typed now
    domain,
    path: '/',
    maxAge: parseRefreshTokenTTL(raw),
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Register endpoint to create a new user
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.authService.register(createUserDto);
    return { message: 'User registered successfully', user };
  }

  // Login endpoint to return JWT token
  // @Post('login')
  // async login(@Body() body: { email: string; password: string }) {
  //   const { email, password } = body;
  //   const user = await this.authService.validateUser(email, password);
  //   if (!user) {
  //     throw new Error('Invalid credentials');
  //   }
  //   return this.authService.login(user);
  // }

   @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { email, password } = body;
    const user = await this.authService.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const result = await this.authService.login(user);

    // Set/rotate refresh token cookie
    res.cookie('refresh_token', result._internal_refresh, refreshCookieOptions());

    // Return only access token and safe user info
    return {
      access_token: result.access_token,
      user: result.user,
    };
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  async refresh(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const userId = req.user.sub;                 // from payload
    const incoming = req.user.refreshToken;      // injected by strategy from cookie

    const result = await this.authService.refreshTokens(userId, incoming);

    // rotate cookie
    res.cookie('refresh_token', result._internal_refresh, refreshCookieOptions());

    return {
      access_token: result.access_token,
      role: result.role,
      user: result.user,
    };
  }

    // Logout: clears cookie and invalidates stored refresh token
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // If you use an access-guarded logout, you can read req.user.sub
    // Otherwise, you can parse a user id from body/header as you prefer.
    res.clearCookie('refresh_token', { path: '/' });
    // Optionally, if you guard this route with access token:
    // await this.authService.logout((req as any).user?.sub);
    return { message: 'Logged out' };
  }

  // Optional: test route protected by access token
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  me(@Req() req: any) {
    return req.user; 
  }

}
