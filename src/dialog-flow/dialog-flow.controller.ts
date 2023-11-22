import { Controller, Post, Body, Res, Req } from '@nestjs/common';
import { DialogFlowService } from './dialog-flow.service';
import { Request, Response } from 'express';
// import { CreateDialogFlowDto } from './dto/create-dialog-flow.dto';
// import { UpdateDialogFlowDto } from './dto/update-dialog-flow.dto';

@Controller('webhook')
export class DialogFlowController {
  constructor(private readonly dialogFlowService: DialogFlowService) {}

  // @Get()
  // intialDialogReponse(@Res() res: Response) {
  //   return this.dialogFlowService.intialMessage(res);
  // }

  @Post()
  dialogPost(@Res() res: Response, @Req() req: Request, @Body() body: any) {
    return this.dialogFlowService.processDialogflowRequest(res, req, body);
  }
}
