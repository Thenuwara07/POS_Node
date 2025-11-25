// src/manager/dto/update-customer-name.dto.ts
import { IsInt, IsString, Length } from 'class-validator';

export class UpdateCustomerNameDto {
  @IsInt()
  customerId: number;

  @IsString()
  @Length(2, 80)
  newName: string;
}
