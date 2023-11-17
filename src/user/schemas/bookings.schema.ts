import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User } from './user.schema';
import mongoose, { Document } from 'mongoose';
import { Vehicles } from 'src/admin/schemas/vehicles.schema';

@Schema({ timestamps: true })
export class Booking extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId: User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' })
  vehicleId: Vehicles;

  @Prop()
  startDate: string;

  @Prop()
  endDate: string;

  @Prop()
  pickup: string;

  @Prop()
  dropoff: string;

  @Prop()
  total: number;

  @Prop()
  grandTotal: number;

  @Prop()
  razorId: string;

  @Prop({ default: 'Booked' })
  status: string;

  @Prop()
  reason: string;

  @Prop()
  paymentMethod: string;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);
