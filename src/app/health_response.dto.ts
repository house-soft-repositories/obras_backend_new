import { ApiProperty } from '@nestjs/swagger';

export default class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  declare status: string;

  @ApiProperty({ example: '2026-10-21T10:00:00.000Z' })
  declare timestamp: string;

  static create(): HealthResponseDto {
    const dto = new HealthResponseDto();
    dto.status = 'ok';
    dto.timestamp = new Date().toISOString();
    return dto;
  }
}
