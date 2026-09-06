import { IsUUID } from 'class-validator';

export default class SwitchTenancyDto {
  @IsUUID()
  tenantId: string;
}
