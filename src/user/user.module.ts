import { Module } from '@nestjs/common';
import { AuthController } from './user.controller';
import { UserService } from './user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { userSchema } from './schemas/user.schema';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { vehicleSchema } from 'src/admin/schemas/vehicles.schema';
import { BookingSchema } from './schemas/bookings.schema';
import moment from 'moment';
// import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
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
    MongooseModule.forFeature([
      { name: 'User', schema: userSchema },
      { name: 'Vehicle', schema: vehicleSchema },
      { name: 'Booking', schema: BookingSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [
    UserService,
    {
      provide: 'MomentWrapper',
      useValue: moment,
    },
  ],
})
export class UserModule {}
