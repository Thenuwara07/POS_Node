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
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody,ApiBearerAuth  } from '@nestjs/swagger';

class LoginDto {
  email: string;
  password: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiBody({ type: CreateUserDto })
  async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.authService.register(createUserDto);
    return { message: 'User registered successfully', user };
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user and get tokens' })
  @ApiResponse({ status: 200, description: 'Tokens returned successfully' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiBody({ type: LoginDto })
  @Post('login')
  async login(@Body() body: LoginDto) {
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Refresh JWT tokens' })
  @ApiResponse({ status: 200, description: 'New tokens returned' })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout user (invalidate refresh token)' })
  @ApiResponse({ status: 200, description: 'Successfully logged out' })
  @Post('logout')
  async logout(@Req() req: any) {
    await this.authService.logout(req.user?.sub); // ✅ call service
    return { message: 'Logged out' };
  }

  // Example protected route
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Returns current user details' })
  me(@Req() req: any) {
    return req.user;
  }
}
