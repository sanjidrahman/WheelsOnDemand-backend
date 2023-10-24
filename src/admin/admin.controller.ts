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
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { Response, Request } from 'express';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { editFileName, imageFileFilter } from 'src/file-uploads.utils';
import * as path from 'path';
import { CreateVehicleDto } from './dto/create-vehicle.dto';

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
    this.adminService.verifyHost(id, res);
  }

  @Post('host/host-notverify/:id')
  HostNotVerify(
    @Param('id') id: string,
    @Body() issue: string,
    @Res() res: Response,
  ) {
    this.adminService.hostNotVerified(id, issue, res);
  }

  @Get('vehicles')
  allVehicles(@Res() res: Response) {
    this.adminService.getAllVehicles(res);
  }

  @Post('add-vehicle')
  add(
    @Body() createVehicle: CreateVehicleDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    this.adminService.addVehicle(createVehicle, res, req);
  }

  @Post('upload-vehicle-images/:id')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './files',
        filename: editFileName,
      }),
      fileFilter: imageFileFilter,
    }),
  )
  uploadFile(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Param('id') id: string,
  ) {
    return this.adminService.uploadVehicleImage(files, id);
  }

  @Post('/upload-single')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './files',
        filename: (req, file, callback) => {
          callback(null, `${file.originalname}`);
        },
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
}
