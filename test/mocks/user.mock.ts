// test/mocks/user.mock.ts
import { Role } from '../../generated/prisma';
import { CreateUserDto } from '../../src/auth/dto/create-user.dto';

// Mock user entity (what gets returned from service)
export const mockUser = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  contact: '+1234567890',
  password: 'hashedPassword123', // This would be hashed in real scenario
  role: Role.CASHIER, // Default role
  colorCode: '#3b82f6', // Example color
  createdAt: new Date(),
  updatedAt: new Date(),
  refreshTokenHash: null
};

// Mock DTO for registration (what client sends)
export const mockUserDto: CreateUserDto = {
  email: 'test@example.com',
  password: 'password123', // Raw password before hashing
  name: 'Test User',
  contact: '+1234567890',
  role: Role.CASHIER
};

// Mock successful registration response
export const mockRegistrationResponse = {
  message: 'User registered successfully',
  user: mockUser
};

// Mock AuthService implementation for register
export const mockAuthService = {
  register: jest.fn().mockResolvedValue(mockUser)
};

export const mockPrismaService = {
  user: {
    create: jest.fn().mockResolvedValue(mockUser),
    findUnique: jest.fn().mockImplementation(() => ({
      then: jest.fn().mockResolvedValue(null) // Default: no user found
    })),update: jest.fn().mockResolvedValue(mockUser),
    // For duplicate email case:
    $exists: {
      user: jest.fn().mockResolvedValue(false)
    }
  }
};