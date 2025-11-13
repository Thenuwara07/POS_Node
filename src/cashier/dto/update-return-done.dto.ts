import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';

// Accept either { is_done: true/false } or { isDone: true/false }
function coalesce<T>(...vals: T[]) {
  for (const v of vals) if (v !== undefined && v !== null) return v;
  return undefined as unknown as T;
}

export class UpdateReturnDoneDto {
  @ApiProperty({ example: true, description: 'Marks the return done (true) or not done (false)' })
  @Transform(({ value, obj }) => coalesce(value, obj.isDone))
  @IsBoolean()
  is_done!: boolean;
}
