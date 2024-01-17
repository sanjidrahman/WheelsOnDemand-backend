import { hostSchema } from './../host/schemas/host.schemas';
import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { userSchema } from 'src/user/schemas/user.schema';
import { adminSchema } from './schemas/admin.schema';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { vehicleSchema } from './schemas/vehicles.schema';
import { BookingSchema } from 'src/user/schemas/bookings.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: userSchema },
      { name: 'Admin', schema: adminSchema },
      { name: 'Host', schema: hostSchema },
      { name: 'Vehicles', schema: vehicleSchema },
      { name: 'Booking', schema: BookingSchema },
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          global: true,
          secret: config.get('JWT_SECRET'),
          signOptions: {
            expiresIn: config.get('JWT_EXPIRES'),
          },
        };
      },
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
