import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role, Department } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'operator@example.com' })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @ApiProperty({ example: 'ChangeMe123!' })
  @IsString()
  @MinLength(6, { message: '密码至少6位' })
  password: string;

  @ApiProperty({ example: '张三' })
  @IsString()
  name: string;

  @ApiProperty({ enum: Role, example: 'OPERATOR' })
  @IsEnum(Role)
  role: Role;

  @ApiPropertyOptional({ enum: Department, example: 'WAREHOUSE' })
  @IsOptional()
  @IsEnum(Department)
  department?: Department;
}
