import { Injectable } from '@nestjs/common';
import HealthResponseDto from '@/app/health_response.dto';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getHealth(): HealthResponseDto {
    return HealthResponseDto.create();
  }
}
