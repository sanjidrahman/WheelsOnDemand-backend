import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './user.service';
import { Signupdto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { Request, Response } from 'express';
import { ChoiseDto } from './dto/choice.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { editFileName, imageFileFilter } from 'src/file-uploads.utils';
import { UpdateUserDto } from './dto/edit-user.dto';

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
  getVehicles(
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
    @Query('filter') filter: any,
  ) {
    console.log(filter);
    return this.authservice.getVehicles(res, req, filter);
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
    return this.authservice.getBooking(res, bookingid);
  }

  @Get('user-booking')
  getUserBooking(@Res() res: Response, @Req() req: Request) {
    return this.authservice.userbookings(res, req);
  }

  @Patch('update-profile')
  @UseInterceptors(
    FileInterceptor('profile', {
      storage: diskStorage({
        destination: './files',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  updateProfile(
    @Res() res: Response,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    return this.authservice.updateUserProfile(res, req, file);
  }

  @Patch('update-user')
  updateUser(
    @Res() res: Response,
    @Req() req: Request,
    @Body() edituserdto: UpdateUserDto,
  ) {
    this.authservice.updateUser(res, req, edituserdto);
  }

  @Post('logout')
  logoutUser(@Req() req: Request, @Res() res: Response) {
    return this.authservice.logout(req, res);
  }
}
