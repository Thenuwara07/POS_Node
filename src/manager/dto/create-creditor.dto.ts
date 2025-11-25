import { IsString, IsOptional, IsNumber, Min, IsNotEmpty } from 'class-validator';

export class CreateCreditorDto {
  @IsString()
  @IsNotEmpty()
  customerContact: string;

  @IsNumber()
  @Min(0)
  totalDue: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
