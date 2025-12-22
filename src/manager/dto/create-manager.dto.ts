import {
  IsString,
  IsEmail,
  IsOptional,
  IsNotEmpty,
  MinLength,
  Matches,
} from 'class-validator';

export class CreateManagerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(?:\+94|94|0)?7\d{8}$/, {
    message:
      'Contact must be a valid Sri Lankan mobile number (e.g. 0771234567 or +94771234567).',
  })
  contact: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(?:\d{9}[vVxX]|\d{12})$/, {
    message:
      'NIC must be a valid Sri Lankan NIC (old: 123456789V, new: 200012345678).',
  })
  nic: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  role?: string; // Default: Manager

  @IsString()
  @IsOptional()
  colorCode?: string; // e.g. #RRGGBB

  @IsOptional()
  createdBy?: number;
}
