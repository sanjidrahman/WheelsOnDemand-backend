import { Controller, Post, Body } from '@nestjs/common';
import { DialogFlowService } from './dialog-flow.service';
// import { CreateDialogFlowDto } from './dto/create-dialog-flow.dto';
// import { UpdateDialogFlowDto } from './dto/update-dialog-flow.dto';

@Controller('dialog-flow')
export class DialogFlowController {
  constructor(private readonly dialogFlowService: DialogFlowService) {}

  @Post('test')
  dialogPost(@Body() body: any) {
    return this.dialogFlowService.processDialogflowRequest(body);
  }

  // @Get()
  // findAll() {
  //   return this.dialogFlowService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.dialogFlowService.findOne(+id);
  // }

  // @Patch(':id')
  // update(
  //   @Param('id') id: string,
  //   @Body() updateDialogFlowDto: UpdateDialogFlowDto,
  // ) {
  //   return this.dialogFlowService.update(+id, updateDialogFlowDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.dialogFlowService.remove(+id);
  // }
}
