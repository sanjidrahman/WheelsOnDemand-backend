import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

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
  location: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Host' })
  createdBy: Types.ObjectId;

  @Prop([String])
  images: string[];

  @Prop()
  document: string;

  @Prop({ default: true })
  isVerified: boolean;

  @Prop({
    type: [
      { userId: MongooseSchema.Types.ObjectId, review: String, replay: String },
    ],
  })
  review: { userId: Types.ObjectId; review: string; replay?: string }[];
}

export const vehicleSchema = SchemaFactory.createForClass(Vehicles);
