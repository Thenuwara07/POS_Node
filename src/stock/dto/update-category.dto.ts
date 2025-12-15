import { IsOptional, IsString, Matches } from 'class-validator';

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  // accept "#RRGGBB" OR "RRGGBB"
  @Matches(/^#?[0-9A-Fa-f]{6}$/, { message: 'colorCode must be RRGGBB or #RRGGBB' })
  colorCode?: string;

  @IsString()
  @IsOptional()
  imageBase64?: string;
}
