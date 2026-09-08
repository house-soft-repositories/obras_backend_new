import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import type ICreateObraPrivadaUseCase from '@/modules/obras-privadas/domain/usecase/create_obra_privada.usecase';
import CreateObraPrivadaDto from '@/modules/obras-privadas/dtos/create_obra_privada.dto';
import ObraPrivadaResponseDto from '@/modules/obras-privadas/dtos/obra_privada_response.dto';
import { CREATE_OBRA_PRIVADA_SERVICE } from '@/modules/obras-privadas/symbols';
import { Body, Controller, HttpException, Inject, Post, UseGuards } from '@nestjs/common';
@Controller('api/obras-privadas')
@UseGuards(AccessTokenGuard)
export default class ObraPrivadaController {
  constructor(@Inject(CREATE_OBRA_PRIVADA_SERVICE) private readonly svc:ICreateObraPrivadaUseCase, private readonly tc:TenantRequestContextService){}
  @Post() async createObraPrivada(@Body() b:CreateObraPrivadaDto, @AuthenticatedUser() u:AccessTokenPayload|undefined){
    return this.tc.run(u, async()=>{
      const tenantId=(u as any)?.tenantId; if(!tenantId) throw new HttpException('Tenant required',400);
      const r=await this.svc.execute({...b, tenantId});
      if(r.isLeft()) throw new HttpException(r.value.message,r.value.statusCode,{cause:r.value.cause});
      return ObraPrivadaResponseDto.fromEntity(r.value);
    });
  }
}
