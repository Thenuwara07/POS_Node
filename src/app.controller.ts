import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Simple health check: returns 1 when the backend responds (online).
  @Get('health')
  health(): { status: number } {
    return { status: 1 };
  }
}
