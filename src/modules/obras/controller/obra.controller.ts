import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import type { Either } from '@/core/types/either';
import AppException from '@/core/exceptions/app_exception';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import type ICreateObraUseCase from '@/modules/obras/domain/usecase/create_obra.usecase';
import CreateObraDto from '@/modules/obras/dtos/create_obra.dto';
import ObraResponseDto from '@/modules/obras/dtos/obra_response.dto';
import { CREATE_OBRA_SERVICE } from '@/modules/obras/symbols';
import { Body, Controller, HttpException, Inject, Post, UseGuards } from '@nestjs/common';
@Controller('api/obras')
@UseGuards(AccessTokenGuard)
export default class ObraController {
  constructor(@Inject(CREATE_OBRA_SERVICE) private readonly create:ICreateObraUseCase, private readonly tc:TenantRequestContextService){}
  @Post() async createObra(@Body() b:CreateObraDto, @AuthenticatedUser() u:AccessTokenPayload|undefined){
    return this.tc.run(u, async()=>{
      const tenantId=(u as any)?.tenantId; if(!tenantId) throw new HttpException('Tenant required',400);
      const r=await this.create.execute({...b, tenantId, criadoPorUsuarioId:(u as any).sub ?? (u as any).id ?? '', });
      if(r.isLeft()) throw new HttpException(r.value.message,r.value.statusCode,{cause:r.value.cause});
      return ObraResponseDto.fromEntity(r.value);
    });
  }
}
