import { IsOptional, IsString, IsEnum, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role, Department, UserStatus } from '@prisma/client';

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ enum: Department })
  @IsOptional()
  @IsEnum(Department)
  department?: Department;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
