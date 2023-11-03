import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './user.service';
import { Signupdto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { Request, Response } from 'express';
import { ChoiseDto } from './dto/choice.dto';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('user')
export class AuthController {
  constructor(private authservice: AuthService) {}

  @Post('signup')
  signup(
    @Body() signupdto: Signupdto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authservice.signup(signupdto, res);
  }

  @Post('login')
  login(@Body() logindto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.authservice.login(logindto, res);
  }

  @Post('auth/login')
  googlelogin(@Body() user: any, @Res({ passthrough: true }) res: Response) {
    return this.authservice.googleReg(user, res);
  }

  @Get('getuser')
  getUser(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authservice.getUser(req, res);
  }

  @Post('verify-otp')
  verify(@Res({ passthrough: true }) res: Response, @Body() otp: any) {
    return this.authservice.verifyOtp(res, otp);
  }

  @Put('store-choice')
  storeChoice(
    @Res({ passthrough: true }) res: Response,
    @Body() choicedto: ChoiseDto,
  ) {
    console.log(choicedto);
    return this.authservice.storeChoices(res, choicedto);
  }

  @Get('vehicles')
  getVehicles(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
    return this.authservice.getVehicles(res, req);
  }

  @Post('book-vehicle')
  postBooking(
    @Body() createbookingdto: CreateBookingDto,
    @Res() res: Response,
  ) {
    return this.authservice.booking(createbookingdto, res);
  }

  @Get('booking-details/:id')
  getBookingDetails(@Res() res: Response, @Param('id') bookingid: string) {
    this.authservice.getBooking(res, bookingid);
  }

  @Post('logout')
  logoutUser(@Req() req: Request, @Res() res: Response) {
    return this.authservice.logout(req, res);
  }
}
