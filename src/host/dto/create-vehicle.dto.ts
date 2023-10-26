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
  model: number;

  @IsNotEmpty()
  price: number;

  @IsOptional()
  image: string[];

  @IsOptional()
  createdBy: string;

  @IsNotEmpty()
  isVerified: boolean = false;
}
