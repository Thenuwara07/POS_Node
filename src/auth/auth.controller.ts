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
import type { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Register endpoint to create a new user
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.authService.register(createUserDto);
    return { message: 'User registered successfully', user };
  }

  // Login endpoint
  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const { email, password } = body;
    const user = await this.authService.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const result = await this.authService.login(user);

    // 🚀 Return tokens directly in response (no cookies)
    return {
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      user: result.user,
    };
  }

  // Refresh endpoint
  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  async refresh(@Req() req: any) {
    const userId = req.user.sub;
    const incoming = req.user.refreshToken;

    const result = await this.authService.refreshTokens(userId, incoming);

    // 🚀 Return new tokens in response
    return {
      access_token: result.access_token,
      refresh_token: result.refresh_token
    };
  }

  // Logout (invalidate refresh token in DB if you’re storing them)
  @Post('logout')
  async logout(@Req() req: Request) {
    // Optionally: await this.authService.logout((req as any).user?.sub);
    return { message: 'Logged out' };
  }

  // Example protected route
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  me(@Req() req: any) {
    return req.user;
  }
}
