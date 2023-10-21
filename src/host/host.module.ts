import { Module } from '@nestjs/common';
import { HostService } from './host.service';
import { HostController } from './host.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { hostSchema } from './schemas/host.schemas';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Host', schema: hostSchema }]),
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
  controllers: [HostController],
  providers: [HostService],
})
export class HostModule {}
