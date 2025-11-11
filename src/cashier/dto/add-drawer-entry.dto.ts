import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNumber, IsOptional, IsPositive, Min, IsString, MaxLength } from 'class-validator';

export enum DrawerType {
  IN = 'IN',
  OUT = 'OUT',
}

export class AddDrawerEntryDto {
  @ApiProperty({ example: 2500.50 })
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  user_id!: number;

  @ApiProperty({ enum: DrawerType, example: 'IN' })
  @IsEnum(DrawerType)
  type!: DrawerType;

  @ApiProperty({ required: false, example: 'Opening float' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;

  @ApiProperty({
    required: false,
    description: 'Epoch ms or ISO-8601 string; defaults to now() if omitted',
    oneOf: [{ type: 'number' }, { type: 'string' }],
    example: 1731222222000,
  })
  @IsOptional()
  when?: number | string;
}
