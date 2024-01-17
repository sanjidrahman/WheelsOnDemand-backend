import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly _appservice: AppService) {}

  @Get()
  getHello(): string {
    return this._appservice.getHello();
  }
}
