import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import PaginationOptionsDto from '@/core/pagination/dto/pagination_options.dto';
import type { Either } from '@/core/types/either';
import AppException from '@/core/exceptions/app_exception';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import type ICreatePessoaUseCase from '@/modules/pessoas/domain/usecase/create_pessoa.usecase';
import type IListPessoasUseCase from '@/modules/pessoas/domain/usecase/list_pessoas.usecase';
import CreatePessoaDto from '@/modules/pessoas/dtos/create_pessoa.dto';
import PessoaResponseDto from '@/modules/pessoas/dtos/pessoa_response.dto';
import { CREATE_PESSOA_SERVICE, LIST_PESSOAS_SERVICE } from '@/modules/pessoas/symbols';
import { Body, Controller, Get, HttpException, Inject, Post, Query, UseGuards } from '@nestjs/common';
@Controller('api/pessoas')
@UseGuards(AccessTokenGuard)
export default class PessoaController {
  constructor(@Inject(CREATE_PESSOA_SERVICE) private readonly create:ICreatePessoaUseCase, @Inject(LIST_PESSOAS_SERVICE) private readonly list:IListPessoasUseCase, private readonly tc:TenantRequestContextService){}
  @Post() async createPessoa(@Body() b:CreatePessoaDto, @AuthenticatedUser() u:AccessTokenPayload|undefined){ return this.withTenant(u, async()=>{ const r=await this.create.execute({...b,tenantId:(u as any)?.tenantId??''}); return PessoaResponseDto.fromEntity(this.unwrap(r)); }); }
  @Get() async listPessoas(@Query() q:PaginationOptionsDto, @AuthenticatedUser() u:AccessTokenPayload|undefined){ return this.withTenant(u, async()=>{ const r=await this.list.execute({...q}); const p=this.unwrap(r); return {data: p.pageData.map((x)=>PessoaResponseDto.fromEntity(x)), meta: p.pageMeta}; }); }
  private async withTenant<T>(u:AccessTokenPayload|undefined,cb:()=>Promise<T>):Promise<T>{ try{ return await this.tc.run(u,cb);}catch(e){ if(e instanceof AppException) this.throwHttp(e); throw e; } }
  private unwrap<T>(r:Either<AppException,T>):T{ if(r.isLeft()) this.throwHttp(r.value); return r.value; }
  private throwHttp(e:AppException):never{ throw new HttpException(e.message,e.statusCode,{cause:e.cause}); }
}
