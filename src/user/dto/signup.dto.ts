import { IsNotEmpty } from 'class-validator';

export class Signupdto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  phone: number;

  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  confirmPass: string;
}
