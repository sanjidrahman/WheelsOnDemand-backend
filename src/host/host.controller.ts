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
} from '@nestjs/common';
import { HostService } from './host.service';
import { CreateHostDto } from './dto/create-host.dto';
// import { UpdateHostDto } from './dto/update-host.dto';
import { Request, Response } from 'express';
import { LoginHostDto } from './dto/login-host.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { editFileName, imageFileFilter } from 'src/file-uploads.utils';
import { UpdateHostDto } from './dto/update-host.dto';
import { CreateVehicleDto } from './dto/create-vehicle.dto';

@Controller('host')
export class HostController {
  constructor(private readonly hostService: HostService) {}

  @Post('/signup')
  create(
    @Body() createHostDto: CreateHostDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.hostService.create(createHostDto, res);
  }

  @Post('verify-otp')
  verify(@Body() otp: any, @Res({ passthrough: true }) res: Response) {
    return this.hostService.otpverify(otp, res);
  }

  @Post('login')
  login(
    @Body() hostlogin: LoginHostDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.hostService.login(hostlogin, res);
  }

  @Get('host-details')
  getHostDetails(@Req() req: Request, @Res() res: Response) {
    this.hostService.hostdetails(req, res);
  }

  @Get('hosts')
  findAll(@Res({ passthrough: true }) res: Response) {
    return this.hostService.getAll(res);
  }

  @Patch('update-host')
  updatehost(
    @Body() updatehostdto: UpdateHostDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    return this.hostService.updatehost(updatehostdto, res, req);
  }

  @Patch('change-pass')
  changepass(@Body() data: any, @Res() res: Response, @Req() req: Request) {
    return this.hostService.changepass(data, res, req);
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
    return this.hostService.uplaodDoc(file, res, id.id);
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
    return this.hostService.uplaodProfile(file, res, req);
  }

  @Post('add-vehicle')
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
    @Body() createvehicledto: CreateVehicleDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    return this.hostService.addVehicle(files, createvehicledto, res, req);
  }
}
