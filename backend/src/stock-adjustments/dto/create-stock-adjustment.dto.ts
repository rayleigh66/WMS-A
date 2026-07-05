import { IsUUID, IsArray, ValidateNested, IsString, IsNumber, Min, IsOptional, MinLength, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class AdjustmentItemDto {
  @ApiProperty() @IsUUID() itemId: string;
  @ApiProperty() @IsUUID() locationId: string;
  @ApiProperty({ example: 100 }) @IsNumber() @Min(0) quantityAfter: number;
  @ApiProperty({ example: '米' }) @IsString() unit: string;
  @ApiPropertyOptional() @IsOptional() @IsString() remark?: string;
}

export class CreateStockAdjustmentDto {
  @ApiProperty() @IsUUID() warehouseId: string;

  @ApiProperty({ example: '盘点差异调整' })
  @IsString() @MinLength(2)
  reason: string;

  @ApiPropertyOptional() @IsOptional() @IsString() remark?: string;

  @ApiProperty({ type: [AdjustmentItemDto] })
  @IsArray() @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AdjustmentItemDto)
  items: AdjustmentItemDto[];
}
