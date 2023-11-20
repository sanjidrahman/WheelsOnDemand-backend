import { Module } from '@nestjs/common';
import { DialogFlowService } from './dialog-flow.service';
import { DialogFlowController } from './dialog-flow.controller';

@Module({
  controllers: [DialogFlowController],
  providers: [DialogFlowService],
})
export class DialogFlowModule {}
