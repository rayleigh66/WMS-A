import { IsEnum, IsUUID, IsArray, ValidateNested, IsString, IsNumber, Min, IsOptional, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StockInType } from '@prisma/client';

export class StockInItemDto {
  @ApiProperty()
  @IsUUID()
  itemId: string;

  @ApiProperty()
  @IsUUID()
  locationId: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiProperty({ example: '米' })
  @IsString()
  unit: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remark?: string;
}

export class CreateStockInDto {
  @ApiProperty({ enum: StockInType, example: 'PURCHASE' })
  @IsEnum(StockInType)
  type: StockInType;

  @ApiProperty()
  @IsUUID()
  warehouseId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remark?: string;

  @ApiProperty({ type: [StockInItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StockInItemDto)
  items: StockInItemDto[];
}
