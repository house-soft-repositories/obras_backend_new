import CreateOrgaoDto from '@/modules/orgaos/dtos/create_orgao.dto';
import { PartialType } from '@nestjs/swagger';

export default class UpdateOrgaoDto extends PartialType(CreateOrgaoDto) {}
