import { IsNotEmpty } from 'class-validator';

export class CreateBookingDto {
  @IsNotEmpty()
  userId: string;

  @IsNotEmpty()
  vehicleId: string;

  @IsNotEmpty()
  startDate: Date;

  @IsNotEmpty()
  endDate: Date;

  @IsNotEmpty()
  pickup: string;

  @IsNotEmpty()
  dropoff: string;

  @IsNotEmpty()
  total: number;

  @IsNotEmpty()
  grandTotal: number;

  @IsNotEmpty()
  razorId: any;
}
