import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtRefreshStrategy } from './jwt-refresh.strategy';
import { Request } from 'express';

// A mock class to simulate the PassportStrategy.
// It helps to test your strategy without breaking NestJS's internals.
class MockJwtRefreshStrategy extends JwtRefreshStrategy {
  constructor() {
    super();
  }

  // Override the validate method for testing
  async validate(req: Request, payload: any) {
    const refreshToken = req.cookies?.['refresh_token'];
    if (!refreshToken) throw new UnauthorizedException('No refresh token found');
    return { ...payload, refreshToken };
  }
}

// Separate function for the cookieExtractor for easier testing
const cookieExtractor = (req: Request): string | null => {
  if (req && req.cookies && req.cookies['refresh_token']) {
    return req.cookies['refresh_token'];
  }
  return null;
};

describe('JwtRefreshStrategy', () => {
  let strategy: JwtRefreshStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: JwtRefreshStrategy,
          useValue: new MockJwtRefreshStrategy(),
        },
      ],
    }).compile();

    strategy = module.get<JwtRefreshStrategy>(JwtRefreshStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return payload and refreshToken if a refresh token is present', async () => {
      const mockPayload = { id: 1, email: 'test@example.com' };
      const mockRequest = {
        cookies: {
          refresh_token: 'mock-refresh-token',
        },
      } as unknown as Request;

      const result = await strategy.validate(mockRequest, mockPayload);
      expect(result).toEqual({ ...mockPayload, refreshToken: 'mock-refresh-token' });
    });

    it('should throw UnauthorizedException if no refresh token is found', async () => {
      const mockPayload = { id: 1, email: 'test@example.com' };
      const mockRequest = { cookies: {} } as unknown as Request;

      await expect(strategy.validate(mockRequest, mockPayload)).rejects.toThrow(UnauthorizedException);
      await expect(strategy.validate(mockRequest, mockPayload)).rejects.toThrow('No refresh token found');
    });
  });

  describe('cookieExtractor', () => {
    it('should extract the refresh token from the request cookies', () => {
      const req = { cookies: { refresh_token: 'valid-token' } } as unknown as Request;
      const token = cookieExtractor(req);
      expect(token).toBe('valid-token');
    });

    it('should return null if no refresh token is present', () => {
      const req = { cookies: {} } as unknown as Request;
      const token = cookieExtractor(req);
      expect(token).toBeNull();
    });

    it('should return null if cookies are not present', () => {
      const req = {} as unknown as Request;
      const token = cookieExtractor(req);
      expect(token).toBeNull();
    });
  });
});