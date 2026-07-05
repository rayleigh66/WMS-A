import { IsString, IsOptional, IsUUID } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateLocationDto {
  @ApiProperty({ example: "A01-01-01" })
  @IsString()
  locationCode: string;

  @ApiProperty({ example: "面料排A01架1层01位" })
  @IsString()
  locationName: string;

  @ApiProperty()
  @IsUUID()
  warehouseId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remark?: string;
}
