import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Vehicles extends Document {
  @Prop()
  name: string;

  @Prop()
  price: number;

  @Prop()
  model: number;

  @Prop()
  transmission: string;

  @Prop()
  brand: string;

  @Prop()
  fuel: string;

  @Prop()
  createdBy: string;

  @Prop([String])
  images: string[];
}

export const vehicleSchema = SchemaFactory.createForClass(Vehicles);
