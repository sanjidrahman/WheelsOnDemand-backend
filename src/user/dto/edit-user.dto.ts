import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Signupdto } from './signup.dto';

export class UpdateUserDto extends PartialType(
  OmitType(Signupdto, ['email'] as const),
) {}
