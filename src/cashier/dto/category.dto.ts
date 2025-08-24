import { IsString } from 'class-validator';

export class CategoryDto {
  @IsString()
  category: string;  // or use number depending on your actual data type
}
