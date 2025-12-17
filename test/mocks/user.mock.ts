import { Role } from '../../generated/prisma';
import { CreateUserDto } from '../../src/auth/dto/create-user.dto';

// Mock user entity (what gets returned from service)
export const mockUser = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  contact: '+1234567890',
  nic: '123456789V',
  password: 'hashedPassword123', // hashed password
  role: Role.Cashier,
  colorCode: '#3b82f6',
  createdAt: new Date(),
  updatedAt: new Date(),
  refreshTokenHash: null,
};

// Mock DTO for registration (what client sends)
export const mockUserDto: CreateUserDto = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
  contact: '+1234567890',
  nic: '123456789V',
  role: Role.Cashier,
};

// Mock successful registration response
export const mockRegistrationResponse = {
  message: 'User registered successfully',
  user: mockUser,
};

// Mock Prisma service
export const mockPrismaService = {
  user: {
    create: jest.fn().mockResolvedValue(mockUser),
    findUnique: jest.fn().mockResolvedValue(null), // default: no user found
    update: jest.fn().mockResolvedValue(mockUser),
  },
};

// Optional: mock AuthService for controller tests
export const mockAuthService = {
  register: jest.fn().mockResolvedValue(mockUser),
  validateUser: jest.fn().mockResolvedValue(mockUser),
  login: jest.fn().mockResolvedValue({
    access_token: 'mock_access_token',
    refresh_token: 'mock_refresh_token',
    user: mockUser,
  }),
  refreshTokens: jest.fn().mockResolvedValue({
    access_token: 'new_access_token',
    refresh_token: 'new_refresh_token',
    role: mockUser.role,
    user: mockUser,
  }),
  logout: jest.fn().mockResolvedValue(undefined),
};
