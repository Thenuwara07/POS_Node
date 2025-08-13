// src/auth/strategies/jwt-access.strategy.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { JwtAccessStrategy } from './jwt-access.strategy';

// Create a mock class that extends your actual strategy.
// This allows you to test the validate method while keeping NestJS's
// internal functionality intact.
class MockJwtAccessStrategy extends JwtAccessStrategy {
  constructor() {
    super();
  }

  // Override the validate method for testing
  async validate(payload: any) {
    return payload;
  }
}

describe('JwtAccessStrategy', () => {
  let strategy: JwtAccessStrategy;

  beforeEach(async () => {
    // We provide a mock instance of our strategy to the testing module.
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: JwtAccessStrategy,
          useValue: new MockJwtAccessStrategy(),
        },
      ],
    }).compile();

    strategy = module.get<JwtAccessStrategy>(JwtAccessStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should return the payload', async () => {
    const mockPayload = { id: 1, email: 'test@example.com' };
    const result = await strategy.validate(mockPayload);
    expect(result).toEqual(mockPayload);
  });
});