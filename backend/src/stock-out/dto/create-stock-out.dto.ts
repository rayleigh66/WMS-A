import { IsEnum, IsUUID, IsArray, ValidateNested, IsString, IsNumber, Min, IsOptional, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StockOutType } from '@prisma/client';

class StockOutItemDto {
  @ApiProperty() @IsUUID() itemId: string;
  @ApiProperty() @IsUUID() locationId: string;
  @ApiProperty({ example: 10 }) @IsNumber() @Min(0.001) quantity: number;
  @ApiProperty({ example: '米' }) @IsString() unit: string;
  @ApiPropertyOptional() @IsOptional() @IsString() remark?: string;
}

export class CreateStockOutDto {
  @ApiProperty({ enum: StockOutType, example: 'PRODUCTION_PICKING' })
  @IsEnum(StockOutType)
  type: StockOutType;

  @ApiProperty() @IsUUID() warehouseId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() remark?: string;

  @ApiProperty({ type: [StockOutItemDto] })
  @IsArray() @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StockOutItemDto)
  items: StockOutItemDto[];
}
