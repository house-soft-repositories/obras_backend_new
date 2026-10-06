import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Post,
  Patch,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
  Inject,
} from '@nestjs/common';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import CriarEmpresaContratadaDto, {
  AtualizarEmpresaContratadaDto,
} from '@/modules/contratos/dtos/create_empresa_contratada.dto';
import {
  CREATE_EMPRESA_CONTRATADA_USE_CASE,
  LIST_EMPRESAS_CONTRATADAS_USE_CASE,
  GET_EMPRESA_CONTRATADA_USE_CASE,
  UPDATE_EMPRESA_CONTRATADA_USE_CASE,
  DELETE_EMPRESA_CONTRATADA_USE_CASE,
} from '@/modules/contratos/symbols';
import type ICreateEmpresaContratadaUseCase from '@/modules/contratos/domain/usecase/create_empresa_contratada.usecase';
import type IListEmpresasContratadasUseCase from '@/modules/contratos/domain/usecase/list_empresas_contratadas.usecase';
import type IGetEmpresaContratadaUseCase from '@/modules/contratos/domain/usecase/get_empresa_contratada.usecase';
import type IUpdateEmpresaContratadaUseCase from '@/modules/contratos/domain/usecase/update_empresa_contratada.usecase';
import type IDeleteEmpresaContratadaUseCase from '@/modules/contratos/domain/usecase/delete_empresa_contratada.usecase';

@Controller('api/empresas-contratadas')
@UseGuards(AccessTokenGuard)
export default class EmpresasContratadasController {
  constructor(
    @Inject(CREATE_EMPRESA_CONTRATADA_USE_CASE)
    private readonly createEmpresa: ICreateEmpresaContratadaUseCase,
    @Inject(LIST_EMPRESAS_CONTRATADAS_USE_CASE)
    private readonly listEmpresas: IListEmpresasContratadasUseCase,
    @Inject(GET_EMPRESA_CONTRATADA_USE_CASE)
    private readonly getEmpresa: IGetEmpresaContratadaUseCase,
    @Inject(UPDATE_EMPRESA_CONTRATADA_USE_CASE)
    private readonly updateEmpresa: IUpdateEmpresaContratadaUseCase,
    @Inject(DELETE_EMPRESA_CONTRATADA_USE_CASE)
    private readonly deleteEmpresa: IDeleteEmpresaContratadaUseCase,
    private readonly tc: TenantRequestContextService,
  ) {}

  @Post()
  async create(
    @Body() dto: CriarEmpresaContratadaDto,
    @AuthenticatedUser() user?: AccessTokenPayload,
  ) {
    return this.tc.run(user, async () => {
      const res = await this.createEmpresa.execute({
        razaoSocial: dto.razaoSocial,
        cnpj: dto.cnpj,
        nomeFantasia: dto.nomeFantasia ?? null,
        responsavel: dto.responsavel ?? null,
        email: dto.email ?? null,
        cargoResponsavel: dto.cargoResponsavel ?? null,
        cep: dto.cep ?? null,
        logradouro: dto.logradouro ?? null,
        numero: dto.numero ?? null,
        complemento: dto.complemento ?? null,
        bairro: dto.bairro ?? null,
        cidade: dto.cidade ?? null,
        uf: dto.uf ?? null,
        telefones: dto.telefones ?? [],
      });
      if (res.isLeft())
        throw new HttpException(res.value.message, res.value.statusCode, {
          cause: res.value.cause,
        });
      return res.value.toObject();
    });
  }

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('take') take?: string,
    @Query('order') order?: string,
    @AuthenticatedUser() user?: AccessTokenPayload,
  ) {
    return this.tc.run(user, async () => {
      const pageOptions = new PageOptionsEntity(
        (order as 'ASC' | 'DESC' | undefined) ?? 'DESC',
        Number(page ?? 1),
        Number(take ?? 10),
      );
      const res = await this.listEmpresas.execute({ pageOptions });
      if (res.isLeft())
        throw new HttpException(res.value.message, res.value.statusCode, {
          cause: res.value.cause,
        });
      return {
        data: res.value.pageData.map((e) => e.toObject()),
        meta: res.value.pageMeta,
      };
    });
  }

  @Get(':id')
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthenticatedUser() user?: AccessTokenPayload,
  ) {
    return this.tc.run(user, async () => {
      const res = await this.getEmpresa.execute({ id });
      if (res.isLeft())
        throw new HttpException(res.value.message, res.value.statusCode, {
          cause: res.value.cause,
        });
      return res.value.toObject();
    });
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarEmpresaContratadaDto,
    @AuthenticatedUser() user?: AccessTokenPayload,
  ) {
    return this.tc.run(user, async () => {
      const res = await this.updateEmpresa.execute({ id, patch: dto });
      if (res.isLeft())
        throw new HttpException(res.value.message, res.value.statusCode, {
          cause: res.value.cause,
        });
      return res.value.toObject();
    });
  }

  @Delete(':id')
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthenticatedUser() user?: AccessTokenPayload,
  ) {
    return this.tc.run(user, async () => {
      const res = await this.deleteEmpresa.execute({ id });
      if (res.isLeft())
        throw new HttpException(res.value.message, res.value.statusCode, {
          cause: res.value.cause,
        });
      return undefined;
    });
  }
}
