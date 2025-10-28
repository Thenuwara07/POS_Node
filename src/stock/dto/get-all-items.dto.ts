import { ApiProperty } from "@nestjs/swagger";

export class GetAllItemsDto{
    
@ApiProperty()
itemId!: number;

@ApiProperty()
  name!: string;

  @ApiProperty()
  categoryName!: string;

  @ApiProperty()
  createdBy!: string | null;

  @ApiProperty()
  qty!: number;

  @ApiProperty()
  unitCost!: number;

  @ApiProperty()
  salesPrice!: number;

  @ApiProperty()
  status!: number;

  @ApiProperty()
  total!: number;
}