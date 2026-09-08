import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export default class PaginationOptionsDto {
  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'ASC' })
  @Transform(({ value }) => ((value ?? 'ASC') === 'DESC' ? 'DESC' : 'ASC'), {
    toClassOnly: true,
  })
  @IsIn(['ASC', 'DESC'])
  @IsOptional()
  readonly order: 'ASC' | 'DESC' = 'ASC';

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  readonly page: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 50, default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  readonly take: number = 10;
}
