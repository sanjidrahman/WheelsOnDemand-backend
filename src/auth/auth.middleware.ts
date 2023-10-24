import {
  HttpException,
  HttpStatus,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class Middleware implements NestMiddleware {
  constructor(
    private jwtservice: JwtService,
    private configService: ConfigService,
  ) {}
  SECRET = this.configService.get('JWT_SECRET');
  async use(req: Request, res: Response, next: NextFunction) {
    const authHeaders = req.headers.authorization;
    console.log(authHeaders, 'authHeaders👁️');
    if (authHeaders && (authHeaders as string).split(' ')[1]) {
      const token = (authHeaders as string).split(' ')[1];
      console.log(token, 'token✅');
      console.log(this.SECRET);
      const decoded = this.jwtservice.verify(token);
      console.log(decoded, 'decoded😮‍💨');
      req.body.userId = decoded._id;
      next();
    } else {
      throw new HttpException('Not authorized.', HttpStatus.UNAUTHORIZED);
    }
  }
}
