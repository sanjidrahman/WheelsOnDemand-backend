import { IsNotEmpty } from 'class-validator';

export class LoginHostDto {
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  password: string;
}
