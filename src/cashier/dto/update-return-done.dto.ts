import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateReturnDoneDto {
  @ApiProperty({ name: 'is_done', example: true })
  @IsBoolean()
  is_done!: boolean;
}
