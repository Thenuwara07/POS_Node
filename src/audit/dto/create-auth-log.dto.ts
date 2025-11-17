import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { AuthAction } from '../../../generated/prisma-client';

export class CreateAuthLogDto {
  /** LOGIN | LOGOUT */
  @IsEnum(AuthAction)
  action: AuthAction;

  /** Optional if you want to set explicitly; defaults to now() inside service */
  @IsOptional() @IsInt()
  timestamp?: number; // ms epoch (will be stored as BigInt)

  /** If known; service will also try to infer from req */
  @IsOptional() @IsInt()
  userId?: number;

  /** Convenience field to log email even if userId absent (e.g., failed login later) */
  @IsOptional() @IsString()
  email?: string;

  /** Network / device info (optional) */
  @IsOptional() @IsString()
  ip?: string;

  @IsOptional() @IsString()
  userAgent?: string;

  /** Any extra JSON payload (claims, source, etc.) */
  @IsOptional()
  meta?: Record<string, any>;
}
