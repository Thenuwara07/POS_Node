import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../src/auth/auth.controller';
import { AuthService } from '../../src/auth/auth.service';
import { mockUser, mockUserDto } from '../../test/mocks/user.mock';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';

// First, create an interface for the JWT payload you expect
interface JwtPayload {
  userId: number;
  email: string;
  role: string;
  // The 'sub' property is the common JWT standard for the subject (user ID).
  sub: number;
  refreshToken: string;
}

// Next, create a custom Request type that includes this payload
interface CustomRequest extends Request {
  user: JwtPayload;
}

// Define the expected response format for a successful registration
const mockRegistrationResponse = {
  message: 'User registered successfully',
  user: {
    ...mockUser,
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
  },
};

// Define the expected response for a successful login
const mockLoginResponse = {
  access_token: 'mock_access_token',
  user: {
    ...mockUser,
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
  },
};

// Mock a request object with a user for testing protected routes
// Now, cast your mockRequest to this new, more specific type
const mockRequest = {
  user: {
    userId: mockUser.id,
    email: mockUser.email,
    role: mockUser.role,
    // Add the 'sub' property as expected by the controller's refresh method
    sub: mockUser.id,
    refreshToken: 'mock_refresh_token_value'
  },
  // Mocking the headers for refresh token tests
  headers: {
    authorization: 'Bearer mock_refresh_token',
  },
} as unknown as CustomRequest; // Use the custom type here

// Mock a response object for testing cookie handling
const mockResponse = {
  cookie: jest.fn(),
  clearCookie: jest.fn(),
  send: jest.fn(),
} as unknown as Response;

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    register: jest.Mock;
    login: jest.Mock;
    validateUser: jest.Mock;
    logout: jest.Mock;
    refreshTokens: jest.Mock;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn().mockResolvedValue(mockUser),
            validateUser: jest.fn().mockResolvedValue(mockUser),
            login: jest.fn().mockResolvedValue({
              access_token: 'mock_access_token',
              _internal_refresh: 'mock_refresh_token_value',
              user: mockUser,
            }),
            logout: jest.fn().mockResolvedValue(undefined),
            refreshTokens: jest.fn().mockResolvedValue({
              access_token: 'new_access_token',
              _internal_refresh: 'new_refresh_token_value',
              role: mockUser.role,
              user: mockUser,
            }),
          },
        },
      ],
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
      
      expect(result).toEqual(mockRegistrationResponse);
      expect(authService.register).toHaveBeenCalledWith(mockUserDto);
    });

    it('should handle registration errors', async () => {
      authService.register.mockRejectedValue(new ForbiddenException('User already exists'));
      
      await expect(controller.register(mockUserDto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('login', () => {
    it('should successfully log in a user and set a cookie', async () => {
      const result = await controller.login(
        { email: mockUserDto.email, password: mockUserDto.password },
        mockResponse,
      );

      expect(authService.validateUser).toHaveBeenCalledWith(
        mockUserDto.email,
        mockUserDto.password,
      );
      expect(authService.login).toHaveBeenCalledWith(mockUser);
      expect(mockResponse.cookie).toHaveBeenCalled();
      expect(result).toEqual(mockLoginResponse);
    });

    it('should throw UnauthorizedException on invalid credentials', async () => {
      authService.validateUser.mockResolvedValue(null);

      await expect(
        controller.login(
          { email: 'wrong@example.com', password: 'wrongpassword' },
          mockResponse,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should successfully refresh tokens and set a new cookie', async () => {
      const result = await controller.refresh(mockRequest, mockResponse);

      expect(authService.refreshTokens).toHaveBeenCalledWith(
        mockRequest.user.sub, // Use the corrected 'sub' property here
        mockRequest.user.refreshToken,
      );
      expect(mockResponse.cookie).toHaveBeenCalled();
      expect(result).toEqual({
        access_token: 'new_access_token',
        role: mockUser.role,
        user: mockUser,
      });
    });
  });

  describe('logout', () => {
    it('should clear the refresh token cookie and return a success message', async () => {
      const result = await controller.logout(mockRequest, mockResponse);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refresh_token', { path: '/' });
      expect(result).toEqual({ message: 'Logged out' });
    });
  });
});
