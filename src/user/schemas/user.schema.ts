import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop()
  name: string;

  @Prop({ unique: [true, { message: 'Email already exists' }] })
  email: string;

  @Prop()
  phone: number;

  @Prop()
  password: string;

  @Prop({ default: false })
  isBlocked: boolean;

  @Prop({ type: Object })
  choices: {
    startDate: string;
    endDate: string;
    pickup: string;
    dropoff: string;
  };

  @Prop()
  profile: string;

  @Prop()
  wallet: number;
}

export const userSchema = SchemaFactory.createForClass(User);
