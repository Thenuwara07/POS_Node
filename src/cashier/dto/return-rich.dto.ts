import { ApiProperty } from '@nestjs/swagger';

export class ReturnUserDto {
  @ApiProperty() 
  id!: number;
  
  @ApiProperty() 
  name!: string;
  
  @ApiProperty() 
  email!: string;
  
  @ApiProperty({ example: '#000000' }) 
  color_code!: string;

}

export class ReturnItemDto {
  @ApiProperty() 
  id!: number;
  
  @ApiProperty() 
  name!: string;
  
  @ApiProperty({ nullable: true }) 
  barcode!: string | null;
  
  @ApiProperty({ example: '#000000' }) 
  color_code!: string;

}

export class ReturnRichDto {
  @ApiProperty()
  id!: number;

  @ApiProperty({ type: ReturnUserDto })
  user!: ReturnUserDto;

  @ApiProperty() 
  batch_id!: string;

  @ApiProperty({ type: ReturnItemDto })
  item!: ReturnItemDto;

  @ApiProperty() 
  quantity!: number;

  @ApiProperty({
    description: 'unit_saled_price as a number (double in Flutter)',
    example: 550.0,
  })
  unit_saled_price!: number;

  @ApiProperty({ nullable: true })
  sale_invoice_id!: string | null;

  @ApiProperty({
    description: 'created_at (epoch ms). If DB uses BIGINT, it is coerced to number.',
    example: 1731234567890,
  })
  created_at!: number;
}
