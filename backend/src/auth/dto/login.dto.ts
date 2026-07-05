import { IsEmail, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({ example: "admin@example.com" })
  @IsEmail({}, { message: "请输入有效的邮箱地址" })
  email: string;

  @ApiProperty({ example: "ChangeMe123!" })
  @IsString()
  @MinLength(6, { message: "密码至少6位" })
  password: string;
}
