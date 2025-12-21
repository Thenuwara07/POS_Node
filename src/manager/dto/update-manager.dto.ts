// src/manager/dto/update-manager.dto.ts
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';

// Allow updating core profile fields plus password (all optional)
export class UpdateManagerDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/^(?:\+94|94|0)?7\d{8}$/, {
    message:
      'Contact must be a valid Sri Lankan mobile number (e.g. 0771234567 or +94771234567).',
  })
  contact?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/^(?:\d{9}[vVxX]|\d{12})$/, {
    message:
      'NIC must be a valid Sri Lankan NIC (old: 123456789V, new: 200012345678).',
  })
  nic?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  colorCode?: string;
}
