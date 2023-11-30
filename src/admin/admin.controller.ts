import { AdminLoginDto } from './dto/login.dto';
import {
  Controller,
  Patch,
  Param,
  Body,
  Post,
  Res,
  Get,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
  Req,
  Query,
  Delete,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { Request, Response } from 'express';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { editFileName, imageFileFilter } from 'src/file-uploads.utils';
import * as path from 'path';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/edit-vehicle.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly _adminService: AdminService) {}

  @Post('/login')
  login(@Body() logindto: AdminLoginDto, @Res() res: Response) {
    this._adminService.adminLogin(logindto, res);
  }

  // @Post('/register')
  // register(@Body() logindto: AdminLoginDto, @Res() res: Response) {
  //   this._adminService.signup(logindto, res);
  // }

  @Patch('user/block/:id')
  blockuser(@Param('id') id: string, @Res() res: Response) {
    return this._adminService.blockuser(id, res);
  }

  @Patch('user/unblock/:id')
  unblockuser(@Param('id') id: string, @Res() res: Response) {
    return this._adminService.unblockuser(id, res);
  }

  @Get('users')
  users(@Res({ passthrough: true }) res: Response) {
    return this._adminService.getAllUsers(res);
  }

  @Patch('host/block/:id')
  blockhost(@Param('id') id: string, @Res() res: Response) {
    return this._adminService.blockhost(id, res);
  }

  @Patch('host/unblock/:id')
  unblockhost(@Param('id') id: string, @Res() res: Response) {
    return this._adminService.unblockhost(id, res);
  }

  @Get('hosts')
  hosts(@Res({ passthrough: true }) res: Response) {
    return this._adminService.getAllHosts(res);
  }

  @Get('getFile/:filename')
  getimage(@Param('filename') file: any, @Res() res: Response) {
    const filePath = path.join(__dirname, '../../files', file);
    res.sendFile(filePath);
  }

  @Post('host/verify-host/:id')
  verifyHost(@Param('id') id: any, @Res() res: Response) {
    return this._adminService.verifyHost(id, res);
  }

  @Post('host/host-notverify/:id')
  HostNotVerify(
    @Param('id') id: string,
    @Body() issue: string,
    @Res() res: Response,
  ) {
    return this._adminService.hostNotVerified(id, issue, res);
  }

  @Get('vehicles')
  allVehicles(@Res() res: Response, @Query('page') page?: number) {
    return this._adminService.getAllVehicles(res, page);
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
    @UploadedFiles()
    files: { files: Array<Express.Multer.File>; doc: Express.Multer.File },
    @Body() createVehicle: CreateVehicleDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    return this._adminService.addVehicle(files, createVehicle, res, req);
  }

  @Patch('verify-host-vehicle')
  verifyhostvehicle(
    @Res() res: Response,
    @Query('vehicleid') vid: string,
    @Query('hostid') hid: string,
  ) {
    this._adminService.verifyHostVehicle(res, vid, hid);
  }

  @Post('reject-host-vehicle/:id')
  rejecthostvehicle(
    @Res() res: Response,
    @Body() issue: any,
    @Param('id') id: string,
  ) {
    this._adminService.rejectHostVehicle(res, id, issue.issue);
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
    console.log(editVehicle, files, 'HII DAAA');
    return this._adminService.editVehicle(files, editVehicle, res, id);
  }

  @Patch('delete-image/:id')
  deleteimg(
    @Res() res: Response,
    @Param('id') id: any,
    @Query('file') file: string,
  ) {
    return this._adminService.deleteImage(res, id, file);
  }

  @Delete('delete-vehicle/:id')
  deletevehicle(@Res() res: Response, @Param('id') id: string) {
    return this._adminService.deleteVehicle(res, id);
  }

  @Get('pagination')
  pagination(@Res() res: Response) {
    return this._adminService.pagination(res);
  }

  @Post('/upload-single')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './files',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  async uploadedFile(@UploadedFile() file: Express.Multer.File) {
    const response = {
      originalname: file.originalname,
      filename: file.filename,
    };
    return response;
  }

  @Get('all-bookings')
  getBooking(@Res() res: Response) {
    return this._adminService.getAllBookings(res);
  }

  @Get('dashboard')
  getDashboard(@Res() res: Response) {
    return this._adminService.dashboard(res);
  }

  @Post('logout')
  logoutUser(@Req() req: Request, @Res() res: Response) {
    return this._adminService.logout(req, res);
  }
}
