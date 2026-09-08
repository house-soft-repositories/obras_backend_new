import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import PaginationOptionsDto from '@/core/pagination/dto/pagination_options.dto';
import type { Either } from '@/core/types/either';
import AppException from '@/core/exceptions/app_exception';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import type ICreateFonteUseCase from '@/modules/fontes/domain/usecase/create_fonte.usecase';
import type IListFontesUseCase from '@/modules/fontes/domain/usecase/list_fontes.usecase';
import CreateFonteDto from '@/modules/fontes/dtos/create_fonte.dto';
import FonteResponseDto from '@/modules/fontes/dtos/fonte_response.dto';
import { CREATE_FONTE_SERVICE, LIST_FONTES_SERVICE } from '@/modules/fontes/symbols';
import { Body, Controller, Get, HttpException, Inject, Post, Query, UseGuards } from '@nestjs/common';
@Controller('api/fontes')
@UseGuards(AccessTokenGuard)
export default class FonteController {
  constructor(@Inject(CREATE_FONTE_SERVICE) private readonly create: ICreateFonteUseCase, @Inject(LIST_FONTES_SERVICE) private readonly list: IListFontesUseCase, private readonly tenantContext: TenantRequestContextService){}
  @Post()
  async createFonte(@Body() body: CreateFonteDto, @AuthenticatedUser() user: AccessTokenPayload | undefined){
    return this.withTenant(user, async()=>{
      const r=await this.create.execute({ ...body, tenantId: (user as any)?.tenantId ?? '' });
      return FonteResponseDto.fromEntity(this.unwrap(r));
    });
  }
  @Get()
  async listFontes(@Query() q: PaginationOptionsDto, @AuthenticatedUser() user: AccessTokenPayload | undefined){
    return this.withTenant(user, async()=>{
      const r=await this.list.execute({ ...q });
      const page=this.unwrap(r);
      return { data: page.pageData.map(FonteResponseDto.fromEntity), meta: page.pageMeta };
    });
  }
  private async withTenant<T>(user:AccessTokenPayload|undefined, cb:()=>Promise<T>):Promise<T>{
    try{ return await this.tenantContext.run(user, cb); } catch(e){ if(e instanceof AppException) this.throwHttp(e); throw e; }
  }
  private unwrap<T>(r:Either<AppException,T>):T{ if(r.isLeft()) this.throwHttp(r.value); return r.value; }
  private throwHttp(e:AppException):never{ throw new HttpException(e.message,e.statusCode,{cause:e.cause}); }
}
