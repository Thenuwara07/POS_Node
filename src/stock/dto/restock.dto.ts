import { ApiProperty } from "@nestjs/swagger";

export class RestockDto{

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
    unitPrice!: number;
  
    @ApiProperty()
    sellPrice!: number;
  
    @ApiProperty()
    status!: number;

    @ApiProperty()
    batchId!: number;
  supplierId: any;

}

