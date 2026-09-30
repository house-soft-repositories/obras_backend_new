import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import type { Either } from '@/core/types/either';
import AppException from '@/core/exceptions/app_exception';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import type IBuscarPessoasUseCase from '@/modules/pessoas/domain/usecase/buscar_pessoas.usecase';
import type ICreatePessoaUseCase from '@/modules/pessoas/domain/usecase/create_pessoa.usecase';
import type IDeletePessoaUseCase from '@/modules/pessoas/domain/usecase/delete_pessoa.usecase';
import type IGetPessoaUseCase from '@/modules/pessoas/domain/usecase/get_pessoa.usecase';
import type IListPessoasUseCase from '@/modules/pessoas/domain/usecase/list_pessoas.usecase';
import type IUpdatePessoaUseCase from '@/modules/pessoas/domain/usecase/update_pessoa.usecase';
import BuscarPessoaQueryDto from '@/modules/pessoas/dtos/buscar_pessoa_query.dto';
import CreatePessoaDto from '@/modules/pessoas/dtos/create_pessoa.dto';
import ListPessoasQueryDto from '@/modules/pessoas/dtos/list_pessoas_query.dto';
import PessoaResponseDto from '@/modules/pessoas/dtos/pessoa_response.dto';
import UpdatePessoaDto from '@/modules/pessoas/dtos/update_pessoa.dto';
import { BUSCAR_PESSOAS_SERVICE, CREATE_PESSOA_SERVICE, DELETE_PESSOA_SERVICE, GET_PESSOA_SERVICE, LIST_PESSOAS_SERVICE, UPDATE_PESSOA_SERVICE } from '@/modules/pessoas/symbols';
import { Body, Controller, Delete, Get, HttpCode, HttpException, Inject, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
@Controller('api/pessoas')
@UseGuards(AccessTokenGuard)
export default class PessoaController {
  constructor(
    @Inject(CREATE_PESSOA_SERVICE) private readonly create:ICreatePessoaUseCase,
    @Inject(LIST_PESSOAS_SERVICE) private readonly list:IListPessoasUseCase,
    @Inject(GET_PESSOA_SERVICE) private readonly get:IGetPessoaUseCase,
    @Inject(UPDATE_PESSOA_SERVICE) private readonly update:IUpdatePessoaUseCase,
    @Inject(DELETE_PESSOA_SERVICE) private readonly remove:IDeletePessoaUseCase,
    @Inject(BUSCAR_PESSOAS_SERVICE) private readonly buscar:IBuscarPessoasUseCase,
    private readonly tc:TenantRequestContextService,
  ){}
  @Post() async createPessoa(@Body() b:CreatePessoaDto, @AuthenticatedUser() u:AccessTokenPayload|undefined){ return this.withTenant(u, async()=>{ const r=await this.create.execute({...b,tenantId:u?.tenantId??''}); return PessoaResponseDto.fromEntity(this.unwrap(r)); }); }
  @Get() async listPessoas(@Query() q:ListPessoasQueryDto, @AuthenticatedUser() u:AccessTokenPayload|undefined){ return this.withTenant(u, async()=>{ const r=await this.list.execute({...q}); const p=this.unwrap(r); return {data: p.pageData.map((x)=>PessoaResponseDto.fromEntity(x)), meta: p.pageMeta}; }); }
  @Get('busca') async buscarPessoas(@Query() q:BuscarPessoaQueryDto, @AuthenticatedUser() u:AccessTokenPayload|undefined){ return this.withTenant(u, async()=>{ const r=await this.buscar.execute({...q}); const p=this.unwrap(r); return {data: p.pageData.map((x)=>PessoaResponseDto.fromEntity(x)), meta: p.pageMeta}; }); }
  @Get(':id') async getPessoa(@Param('id') id:string, @AuthenticatedUser() u:AccessTokenPayload|undefined){ return this.withTenant(u, async()=>{ const r=await this.get.execute({id}); return PessoaResponseDto.fromEntity(this.unwrap(r)); }); }
  @Patch(':id') async updatePessoa(@Param('id') id:string, @Body() b:UpdatePessoaDto, @AuthenticatedUser() u:AccessTokenPayload|undefined){ return this.withTenant(u, async()=>{ const r=await this.update.execute({id, data:{...b}}); return PessoaResponseDto.fromEntity(this.unwrap(r)); }); }
  @Delete(':id') @HttpCode(204) async deletePessoa(@Param('id') id:string, @AuthenticatedUser() u:AccessTokenPayload|undefined){ return this.withTenant(u, async()=>{ const r=await this.remove.execute({id}); this.unwrap(r); }); }
  private async withTenant<T>(u:AccessTokenPayload|undefined,cb:()=>Promise<T>):Promise<T>{ try{ return await this.tc.run(u,cb);}catch(e){ if(e instanceof AppException) this.throwHttp(e); throw e; } }
  private unwrap<T>(r:Either<AppException,T>):T{ if(r.isLeft()) this.throwHttp(r.value); return r.value; }
  private throwHttp(e:AppException):never{ throw new HttpException(e.message,e.statusCode,{cause:e.cause}); }
}
