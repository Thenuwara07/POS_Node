import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../src/auth/auth.controller';
import { AuthService } from '../../src/auth/auth.service';
import { mockUser, mockUserDto } from '../../test/mocks/user.mock';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

interface JwtUser {
  sub: number;
  refreshToken: string;
}
interface MockRequest extends Partial<Request> {
  user: JwtUser;
}

// Mocked AuthService
const mockAuthService = {
  register: jest.fn().mockResolvedValue(mockUser),
  validateUser: jest.fn().mockResolvedValue(mockUser),
  login: jest.fn().mockResolvedValue({
    access_token: 'mock_access_token',
    refresh_token: 'mock_refresh_token',
    user: mockUser,
  }),
  logout: jest.fn().mockResolvedValue(undefined),
  refreshTokens: jest.fn().mockResolvedValue({
    access_token: 'new_access_token',
    refresh_token: 'new_refresh_token',
    role: mockUser.role,
    user: mockUser,
  }),
};

const mockRequest: MockRequest = {
  user: {
    sub: mockUser.id,
    refreshToken: 'mock_refresh_token',
  },
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: typeof mockAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a user', async () => {
      const result = await controller.register(mockUserDto);

      expect(authService.register).toHaveBeenCalledWith(mockUserDto);
      expect(result).toEqual({
        message: 'User registered successfully',
        user: mockUser,
      });
    });

    it('should throw ForbiddenException if registration fails', async () => {
      authService.register.mockRejectedValueOnce(new ForbiddenException('User already exists'));

      await expect(controller.register(mockUserDto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('login', () => {
    it('should successfully log in a user', async () => {
      const result = await controller.login({
        email: mockUserDto.email,
        password: mockUserDto.password,
      });

      expect(authService.validateUser).toHaveBeenCalledWith(
        mockUserDto.email,
        mockUserDto.password,
      );
      expect(authService.login).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        user: mockUser,
      });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      authService.validateUser.mockResolvedValueOnce(null);

      await expect(
        controller.login({ email: 'wrong@example.com', password: 'wrongpass' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should successfully refresh tokens', async () => {
      const result = await controller.refresh(mockRequest);

      expect(authService.refreshTokens).toHaveBeenCalledWith(
        mockRequest.user.sub,
        mockRequest.user.refreshToken,
      );
      expect(result).toEqual({
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token'
      });
    });

    it('should throw UnauthorizedException if refresh fails', async () => {
      authService.refreshTokens.mockRejectedValueOnce(new UnauthorizedException());

      await expect(controller.refresh(mockRequest)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should call authService.logout and return message', async () => {
      const mockUserId = '123';
      const mockRequest = { user: { sub: mockUserId } } as any;

      const result = await controller.logout(mockRequest);

      expect(authService.logout).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual({ message: 'Logged out' });
    });
  });

});
