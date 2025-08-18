import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  supplierId: number;

  @IsString()
  @IsOptional()
  colorCode?: string; // Defaults to "#000000" in Prisma
}
