import { PartialType } from '@nestjs/mapped-types';
import { CreateVehicleDto } from 'src/admin/dto/create-vehicle.dto';

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {}
