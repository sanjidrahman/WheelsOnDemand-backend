import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Res,
  UseInterceptors,
  UploadedFile,
  Req,
  Patch,
  UploadedFiles,
  Query,
  Delete,
} from '@nestjs/common';
import { HostService } from './host.service';
import { CreateHostDto } from './dto/create-host.dto';
// import { UpdateHostDto } from './dto/update-host.dto';
import { Request, Response } from 'express';
import { LoginHostDto } from './dto/login-host.dto';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { editFileName, imageFileFilter } from 'src/file-uploads.utils';
import { UpdateHostDto } from './dto/update-host.dto';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Controller('host')
export class HostController {
  constructor(private readonly _hostService: HostService) {}

  @Post('/signup')
  create(
    @Body() createHostDto: CreateHostDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this._hostService.create(createHostDto, res);
  }

  @Post('verify-otp')
  verify(@Body() otp: any, @Res({ passthrough: true }) res: Response) {
    return this._hostService.otpverify(otp, res);
  }

  @Post('login')
  login(
    @Body() hostlogin: LoginHostDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this._hostService.login(hostlogin, res);
  }

  @Get('host-details')
  getHostDetails(@Req() req: Request, @Res() res: Response) {
    this._hostService.hostdetails(req, res);
  }

  @Get('dashboard')
  getDashboard(@Res() res: Response, @Req() req: Request) {
    return this._hostService.dashboard(res, req);
  }

  @Get('hosts')
  findAll(@Res({ passthrough: true }) res: Response) {
    return this._hostService.getAllHost(res);
  }

  @Patch('update-host')
  updatehost(
    @Body() updatehostdto: UpdateHostDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    return this._hostService.updatehost(updatehostdto, res, req);
  }

  @Patch('change-pass')
  changepass(@Body() data: any, @Res() res: Response, @Req() req: Request) {
    return this._hostService.changepass(data, res, req);
  }

  @Post('/upload-doc/:id')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './files',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async uploadedFile(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
    @Param() id: any,
  ) {
    return this._hostService.uplaodDoc(file, res, id.id);
  }

  @Post('/upload-profile')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './files',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async uploaded(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    return this._hostService.uplaodProfile(file, res, req);
  }

  @Get('host-vehicles')
  hostvehicle(
    @Res() res: Response,
    @Req() req: Request,
    @Query('page') page?: number,
  ) {
    return this._hostService.hostvehicles(res, req, page);
  }

  @Post('add-vehicle')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'files', maxCount: 10 },
        { name: 'doc', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './files',
          filename: editFileName,
        }),
        fileFilter: imageFileFilter,
      },
    ),
  )
  uploadFile(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() createvehicledto: CreateVehicleDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    return this._hostService.addVehicle(files, createvehicledto, res, req);
  }

  @Patch('edit-vehicle/:id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'files', maxCount: 10 },
        { name: 'doc', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './files',
          filename: editFileName,
        }),
        fileFilter: imageFileFilter,
      },
    ),
  )
  editVehicle(
    @Body() editVehicle: UpdateVehicleDto,
    @Param('id') id: any,
    @Res() res: Response,
    @UploadedFiles() files?: Array<Express.Multer.File>,
  ) {
    return this._hostService.editVehicle(files, editVehicle, res, id);
  }

  @Get('vehicle-details/:id')
  vehicleDetails(@Res() res: Response, @Param('id') v_id: string) {
    this._hostService.getVehicleDetails(res, v_id);
  }

  @Patch('delete-image/:id')
  deleteimg(
    @Res() res: Response,
    @Param('id') id: any,
    @Query('file') file: string,
  ) {
    return this._hostService.deleteImage(res, id, file);
  }

  @Delete('delete-vehicle/:id')
  deletevehicle(@Res() res: Response, @Param('id') id: string) {
    return this._hostService.deleteVehicle(res, id);
  }

  @Get('host-bookings')
  getHostBooking(@Res() res: Response, @Req() req: Request) {
    return this._hostService.hostBooking(res, req);
  }

  @Patch('edit-booking-status/:id')
  editBookingStatus(
    @Res() res: Response,
    @Param('id') b_id: string,
    @Body('status') status: string,
  ) {
    this._hostService.editBookingStatus(res, b_id, status);
  }

  @Post('forgot-password')
  forgotpass(@Res() res: Response, @Body('email') email: string) {
    return this._hostService.forgotpassword(res, email);
  }

  @Patch('reset-password/:h_id')
  resetPassword(
    @Res() res: Response,
    @Param('h_id') hostId: string,
    @Body('newpass') newpassword: string,
    @Body('confirmpass') confirmpass: string,
  ) {
    return this._hostService.resetPass(res, hostId, newpassword, confirmpass);
  }

  @Post('logout')
  logoutUser(@Req() req: Request, @Res() res: Response) {
    return this._hostService.logout(req, res);
  }
}
