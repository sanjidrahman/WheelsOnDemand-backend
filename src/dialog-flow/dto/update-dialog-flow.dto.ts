import { PartialType } from '@nestjs/swagger';
import { CreateDialogFlowDto } from './create-dialog-flow.dto';

export class UpdateDialogFlowDto extends PartialType(CreateDialogFlowDto) {}
