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
}

export const userSchema = SchemaFactory.createForClass(User);
