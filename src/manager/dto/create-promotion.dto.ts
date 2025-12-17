import {
  IsArray,
  ArrayNotEmpty,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum PromotionType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
  BUY_X_GET_Y = 'BUY_X_GET_Y',
}

export enum ScopeKind {
  ALL = 'ALL',
  ITEM = 'ITEM',
  CATEGORY = 'CATEGORY',
}

export class CreatePromotionDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(PromotionType)
  type!: PromotionType;

  @IsEnum(ScopeKind)
  scopeKind!: ScopeKind;

  /**
   * ITEM  -> array of item IDs
   * CATEGORY -> array of category IDs
   * ALL -> omit/empty
   * BUY_X_GET_Y -> optionally send a single object: { buyQty, getQty, itemIds? , categoryIds? }
   */
  @IsOptional()
  @ValidateIf((o) => {
    if (o.type === PromotionType.BUY_X_GET_Y) return true;
    if (o.scopeKind === ScopeKind.ALL) return false;
    if (o.scopeKind === ScopeKind.ITEM) return !Array.isArray(o.itemIds);
    if (o.scopeKind === ScopeKind.CATEGORY) return !Array.isArray(o.categoryIds);
    return true;
  })
  @IsArray()
  scopeValue?: (string | number | Record<string, any>)[];

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map((n: any) => Number(n)) : undefined,
  )
  itemIds?: number[];

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map((n: any) => Number(n)) : undefined,
  )
  categoryIds?: number[];

  /**
   * Main numeric value
   *  - PERCENTAGE: 0..100
   *  - FIXED: >= 0
   *  - BUY_X_GET_Y: can be 0 (unused)
   */
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  value!: number;

  @IsBoolean()
  stackable!: boolean; // UI toggle -> store as 1/0

  @IsBoolean()
  active!: boolean; // UI toggle -> store as 1/0

  @IsInt()
  @Type(() => Number)
  @Min(0)
  priority!: number; // "lower runs first"

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  perCustomerLimit?: number;

  // ---- schedule ----
  @IsOptional()
  @IsString()
  startTime?: string; // 'HH:mm'

  @IsOptional()
  @IsString()
  endTime?: string; // 'HH:mm'

  @IsOptional()
  @Type(() => Number)
  startDate?: number; // unix ms

  @IsOptional()
  @Type(() => Number)
  endDate?: number; // unix ms

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map((n: any) => Number(n)) : undefined,
  )
  daysOfWeek?: number[]; // 1..7 Mon..Sun

  // optional audit
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  createdById?: number;
}
