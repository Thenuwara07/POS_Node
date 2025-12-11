// import { ApiPropertyOptional } from '@nestjs/swagger';
// import { Transform } from 'class-transformer';
// import { IsInt, IsOptional, Min } from 'class-validator';

// export class QueryBillHistoryDto {
//   @ApiPropertyOptional({ example: 50, description: 'Max rows to return (default 50)' })
//   @Transform(({ value }) =>
//     value == null ? undefined : Number.parseInt(String(value), 10),
//   )
//   @IsOptional()
//   @IsInt()
//   @Min(1)
//   limit?: number;

//   @ApiPropertyOptional({ example: 0, description: 'Rows to skip (default 0)' })
//   @Transform(({ value }) =>
//     value == null ? undefined : Number.parseInt(String(value), 10),
//   )
//   @IsOptional()
//   @IsInt()
//   @Min(0)
//   offset?: number;

//   @ApiPropertyOptional({
//     example: 1733875200000,
//     description: 'Filter payments from this epoch-ms (inclusive)',
//   })
//   @Transform(({ value }) =>
//     value == null ? undefined : Number.parseInt(String(value), 10),
//   )
//   @IsOptional()
//   @IsInt()
//   dateFromMillis?: number;

//   @ApiPropertyOptional({
//     example: 1733961599000,
//     description: 'Filter payments up to this epoch-ms (inclusive)',
//   })
//   @Transform(({ value }) =>
//     value == null ? undefined : Number.parseInt(String(value), 10),
//   )
//   @IsOptional()
//   @IsInt()
//   dateToMillis?: number;
// }
