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
  FilesInterceptor,
} from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { editFileName, imageFileFilter } from 'src/file-uploads.utils';
import * as path from 'path';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/edit-vehicle.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('/login')
  login(@Body() logindto: AdminLoginDto, @Res() res: Response) {
    this.adminService.AdminLogin(logindto, res);
  }

  // @Post('/register')
  // register(@Body() logindto: AdminLoginDto, @Res() res: Response) {
  //   this.adminService.signup(logindto, res);
  // }

  @Patch('user/block/:id')
  blockuser(@Param('id') id: string, @Res() res: Response) {
    return this.adminService.blockuser(id, res);
  }

  @Patch('user/unblock/:id')
  unblockuser(@Param('id') id: string, @Res() res: Response) {
    return this.adminService.unblockuser(id, res);
  }

  @Get('users')
  users(@Res({ passthrough: true }) res: Response) {
    return this.adminService.getAllUsers(res);
  }

  @Patch('host/block/:id')
  blockhost(@Param('id') id: string, @Res() res: Response) {
    return this.adminService.blockhost(id, res);
  }

  @Patch('host/unblock/:id')
  unblockhost(@Param('id') id: string, @Res() res: Response) {
    return this.adminService.unblockhost(id, res);
  }

  @Get('hosts')
  hosts(@Res({ passthrough: true }) res: Response) {
    return this.adminService.getAllHosts(res);
  }

  @Get('getFile/:filename')
  getimage(@Param('filename') file: any, @Res() res: Response) {
    const filePath = path.join(__dirname, '../../files', file);
    res.sendFile(filePath);
  }

  @Post('host/verify-host/:id')
  verifyHost(@Param('id') id: any, @Res() res: Response) {
    return this.adminService.verifyHost(id, res);
  }

  @Post('host/host-notverify/:id')
  HostNotVerify(
    @Param('id') id: string,
    @Body() issue: string,
    @Res() res: Response,
  ) {
    return this.adminService.hostNotVerified(id, issue, res);
  }

  @Get('vehicles')
  allVehicles(@Res() res: Response, @Query('page') page?: number) {
    // console.log(page, 'PAGE');
    return this.adminService.getAllVehicles(res, page);
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
    return this.adminService.addVehicle(files, createVehicle, res, req);
  }

  @Patch('verify-host-vehicle')
  verifyhostvehicle(
    @Res() res: Response,
    @Query('vehicleid') vid: string,
    @Query('hostid') hid: string,
  ) {
    this.adminService.verifyHostVehicle(res, vid, hid);
  }

  @Post('reject-host-vehicle/:id')
  rejecthostvehicle(
    @Res() res: Response,
    @Body() issue: any,
    @Param('id') id: string,
  ) {
    this.adminService.rejectHostVehicle(res, id, issue.issue);
  }

  @Patch('edit-vehicle/:id')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './files',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  editVehicle(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() editVehicle: UpdateVehicleDto,
    @Param('id') id: any,
    @Res() res: Response,
  ) {
    return this.adminService.editVehicle(files, editVehicle, res, id);
  }

  @Patch('delete-image/:id')
  deleteimg(
    @Res() res: Response,
    @Param('id') id: any,
    @Query('file') file: string,
  ) {
    return this.adminService.deleteImage(res, id, file);
  }

  @Delete('delete-vehicle/:id')
  deletevehicle(@Res() res: Response, @Param('id') id: string) {
    return this.adminService.deleteVehicle(res, id);
  }

  @Get('pagination')
  pagination(@Res() res: Response) {
    return this.adminService.pagination(res);
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

  @Post('logout')
  logoutUser(@Req() req: Request, @Res() res: Response) {
    return this.adminService.logout(req, res);
  }
}
