/* eslint-disable prettier/prettier */
import { Body, Controller, Get, Post, Put, Req, Res } from '@nestjs/common';
import { AuthService } from './user.service';
import { Signupdto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { Request, Response } from 'express';
import { ChoiseDto } from './dto/choice.dto';

@Controller('user')
export class AuthController {
  constructor(private authservice: AuthService) { }

  @Post('signup')
  signup(@Body() signupdto: Signupdto, @Res({ passthrough: true }) res: Response) {
    return this.authservice.signup(signupdto, res);
  }

  @Post('login')
  login(@Body() logindto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.authservice.login(logindto, res);
  }

  @Post('auth/login')
  googlelogin(@Body() user: any, @Res({ passthrough: true }) res: Response) {
    return this.authservice.googleReg(user, res)
  }

  @Get('getuser')
  getUser(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authservice.getUser(req, res)
  }

  @Post('verify-otp')
  verify(@Res({ passthrough: true }) res: Response , @Body() otp: any) {
    return this.authservice.verifyOtp(res , otp)
  }

  @Put('store-choice')
  storeChoice(@Res({ passthrough: true }) res: Response, @Body() choicedto: ChoiseDto) {
    console.log('djfkodsj');
    console.log(choicedto.userId);
    return this.authservice.storeChoices(res, choicedto);
  }

  @Get('vehicles') 
  getVehicles(@Res({ passthrough: true }) res: Response ) {
    return this.authservice.getVehicles(res);
  }

  @Post('logout')
  logoutUser(@Req() req: Request, @Res() res: Response) {
    return this.authservice.logout(req , res)
  }
}

