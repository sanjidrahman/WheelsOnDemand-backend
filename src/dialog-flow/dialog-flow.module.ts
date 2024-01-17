import { Module } from '@nestjs/common';
import { DialogFlowService } from './dialog-flow.service';
import { DialogFlowController } from './dialog-flow.controller';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [DialogFlowController],
  providers: [DialogFlowService, JwtService],
})
export class DialogFlowModule {}
