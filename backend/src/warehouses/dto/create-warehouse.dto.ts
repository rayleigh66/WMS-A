import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWarehouseDto {
  @ApiProperty({ example: 'RAW-MAT' })
  @IsString()
  @MaxLength(50)
  warehouseCode: string;

  @ApiProperty({ example: '原料仓' })
  @IsString()
  warehouseName: string;

  @ApiPropertyOptional({ example: '原材料存放仓库' })
  @IsOptional()
  @IsString()
  remark?: string;
}
