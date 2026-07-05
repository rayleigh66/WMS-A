import { IsString, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ItemCategory, ItemStatus } from '@prisma/client';

export class CreateItemDto {
  @ApiProperty({ example: 'FAB-210D-BK' })
  @IsString()
  itemCode: string;

  @ApiProperty({ example: '210D 尼龙面料' })
  @IsString()
  itemName: string;

  @ApiProperty({ enum: ItemCategory, example: 'FABRIC' })
  @IsEnum(ItemCategory)
  category: ItemCategory;

  @ApiPropertyOptional({ example: '210D 高弹' })
  @IsOptional()
  @IsString()
  specification?: string;

  @ApiPropertyOptional({ example: '黑色' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ example: '米' })
  @IsString()
  unit: string;

  @ApiPropertyOptional({ example: '广州中大布市' })
  @IsOptional()
  @IsString()
  supplier?: string;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  safetyStock?: number;

  @ApiPropertyOptional({ enum: ItemStatus, default: 'ACTIVE' })
  @IsOptional()
  @IsEnum(ItemStatus)
  status?: ItemStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remark?: string;
}
