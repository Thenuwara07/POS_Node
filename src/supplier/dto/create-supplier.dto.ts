import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateSupplierDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  brand: string;

  @ApiProperty({ description: 'Mobile number' })
  @IsString()
  @IsNotEmpty()
  // keep your regex if you want
  contact: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Defaults to #000000 if omitted' })
  @IsOptional()
  @Matches(/^#?[0-9A-Fa-f]{6}$/, { message: 'colorCode must be RRGGBB or #RRGGBB' })
  colorCode?: string;
}
