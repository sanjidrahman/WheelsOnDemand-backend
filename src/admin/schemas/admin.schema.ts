import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Admin extends Document {
  @Prop()
  email: string;

  @Prop()
  password: string;
}

export const adminSchema = SchemaFactory.createForClass(Admin);
