import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { HostService } from './host.service';
import { CreateHostDto } from './dto/create-host.dto';
import { UpdateHostDto } from './dto/update-host.dto';
import { Response } from 'express';
import { LoginHostDto } from './dto/login-host.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { editFileName, imageFileFilter } from 'src/file-uploads.utils';

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

  @Get('hosts')
  findAll(@Res({ passthrough: true }) res: Response) {
    return this.hostService.getAll(res);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.hostService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHostDto: UpdateHostDto) {
    return this.hostService.update(+id, updateHostDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.hostService.remove(+id);
  }

  @Post('/upload-single/:id')
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
}
