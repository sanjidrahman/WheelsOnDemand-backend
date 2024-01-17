import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateVehicleDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  brand: string;

  @IsNotEmpty()
  fuel: string;

  @IsNotEmpty()
  location: string;

  @IsNotEmpty()
  transmission: string;

  @IsNotEmpty()
  make: number;

  @IsNotEmpty()
  price: number;

  @IsOptional()
  image: string[];

  @IsOptional()
  userId: string;

  @IsNotEmpty()
  isVerified: boolean = false;
}
