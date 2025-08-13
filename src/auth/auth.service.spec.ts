import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/auth/auth.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '../../generated/prisma';
import { mockUser, mockUserDto, mockPrismaService } from '../../test/mocks/user.mock';

// Mock the entire bcrypt module to avoid "Cannot redefine property" errors
jest.mock('bcrypt', () => ({
  hash: jest.fn(() => 'hashedpassword'),
  compare: jest.fn(() => true),
  genSalt: jest.fn(() => 'salt'),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should create a user with a hashed password', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.user, 'create').mockResolvedValue(mockUser);
      
      const result = await service.register(mockUserDto);

      // CORRECTED: Expect bcrypt.hash to be called with the password and the mocked salt
      expect(bcrypt.hash).toHaveBeenCalledWith(mockUserDto.password, 'salt');
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: mockUserDto.email,
          password: 'hashedpassword',
          role: mockUserDto.role,
        }),
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw an error if the email already exists', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      await expect(service.register(mockUserDto)).rejects.toThrow('User already exists');
    });
  });

  describe('validateUser', () => {
    it('should return a user if credentials are valid', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(mockUser.email, 'password123');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: mockUser.email } });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', mockUser.password);
      expect(result).toEqual(mockUser);
    });

    it('should return null if the user does not exist', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      const result = await service.validateUser('nonexistent@email.com', 'password123');
      expect(result).toBeNull();
    });

    it('should return null if the password does not match', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const result = await service.validateUser(mockUser.email, 'wrongpassword');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token and user info', async () => {
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue('mock-token');
      jest.spyOn(service, 'updateRefreshTokenHash' as any).mockResolvedValue(undefined);
      
      const result = await service.login(mockUser);

      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        access_token: 'mock-token',
        _internal_refresh: 'mock-token',
        user: { id: mockUser.id, email: mockUser.email, role: mockUser.role },
      });
    });
  });

  describe('refreshTokens', () => {
    it('should return new tokens if refresh token is valid', async () => {
      const incomingRefreshToken = 'mock-refresh-token';
      const userWithHash = { ...mockUser, refreshTokenHash: 'hashed-mock-refresh-token' };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(userWithHash);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue('new-mock-token');
      jest.spyOn(service, 'updateRefreshTokenHash' as any).mockResolvedValue(undefined);
      
      const result = await service.refreshTokens(mockUser.id, incomingRefreshToken);

      expect(bcrypt.compare).toHaveBeenCalledWith(incomingRefreshToken, 'hashed-mock-refresh-token');
      expect(result.access_token).toBe('new-mock-token');
      expect(result._internal_refresh).toBe('new-mock-token');
    });

    it('should throw ForbiddenException if user or hash is missing', async () => {
      const userWithNoHash = { ...mockUser, refreshTokenHash: null };
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(userWithNoHash);
      await expect(service.refreshTokens(mockUser.id, 'some-token')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if refresh token does not match', async () => {
      const userWithHash = { ...mockUser, refreshTokenHash: 'some-hash' };
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(userWithHash);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.refreshTokens(mockUser.id, 'wrong-token')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
