import { IsString, IsEmail, IsNotEmpty, IsEnum } from 'class-validator';
import { UserRole } from '../../auth/enums/user-role.enum';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsEnum(UserRole)
  @IsNotEmpty()
  role!: UserRole;
} 