import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Host extends Document {
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

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  document: string;

  @Prop()
  profile: string;
}

export const hostSchema = SchemaFactory.createForClass(Host);
