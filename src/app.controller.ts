import { Controller, Get } from '@nestjs/common';
import { AppService } from '@/app.service';
import HealthResponseDto from '@/app/health_response.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): HealthResponseDto {
    return this.appService.getHealth();
  }
}
