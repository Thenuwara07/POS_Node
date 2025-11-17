import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, Min } from 'class-validator';

// coalesce helper for alt keys
const co = <T>(v: T, ...alts: any[]) => (v ?? alts.find(a => a !== undefined));

export class InsertDrawerDto {
  @ApiProperty({ example: 2500.75 })
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiProperty({ example: 'Opening float' })
  @IsNotEmpty()
  reason!: string;

  @ApiProperty({ example: 'OPEN', description: 'OPEN | IN | OUT | CLOSE (or any non-empty string)' })
  @IsNotEmpty()
  type!: string;

  @ApiProperty({ example: 1, description: 'user_id (alt: userId)' })
  @Transform(({ value, obj }) => co(value, obj.userId))
  @IsInt()
  @Min(1)
  user_id!: number;

  @ApiPropertyOptional({
    description: 'epoch ms or ISO string; default now()',
    oneOf: [{ type: 'number' }, { type: 'string' }],
    example: 1731234567890,
  })
  @Transform(({ value, obj }) => co(value, obj.created_at, obj.createdAt))
  @IsOptional()
  date?: number | string;
}
