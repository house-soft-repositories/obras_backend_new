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
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import CriarEmpresaContratadaDto, { AtualizarEmpresaContratadaDto } from '@/modules/contratos/dtos/create_empresa_contratada.dto';
import { EMPRESAS_CONTRATADAS_SERVICE } from '@/modules/contratos/symbols';
import EmpresasContratadasService from '@/modules/contratos/application/empresas_contratadas.service';
@Controller('api/empresas-contratadas')
@UseGuards(AccessTokenGuard)
export default class EmpresasContratadasController {
  constructor(
    @Inject(EMPRESAS_CONTRATADAS_SERVICE)
    private readonly svc: EmpresasContratadasService,
    private readonly tc: TenantRequestContextService,
  ) {}

  @Post()
  async create(
    @Body() dto: CriarEmpresaContratadaDto,
    @AuthenticatedUser() user?: AccessTokenPayload,
  ) {
    return this.tc.run(user, async () => {
      const res = await this.svc.create({
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
      return (res.value as any).toObject();
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
        (order as any) ?? 'DESC',
        Number(page ?? 1),
        Number(take ?? 10),
      );
      const res = await this.svc.list(pageOptions);
      if (res.isLeft())
        throw new HttpException(res.value.message, res.value.statusCode, {
          cause: res.value.cause,
        });
      return {
        data: res.value.pageData.map((e: any) =>
          e.toObject ? e.toObject() : e,
        ),
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
      const res = await this.svc.getById(id);
      if (res.isLeft()) throw new HttpException(res.value.message, res.value.statusCode, { cause: res.value.cause });
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
      const res = await this.svc.update(id, dto);
      if (res.isLeft()) throw new HttpException(res.value.message, res.value.statusCode, { cause: res.value.cause });
      return res.value.toObject();
    });
  }

  @Delete(':id')
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @AuthenticatedUser() user?: AccessTokenPayload,
  ) {
    return this.tc.run(user, async () => {
      const res = await this.svc.delete(id);
      if (res.isLeft()) throw new HttpException(res.value.message, res.value.statusCode, { cause: res.value.cause });
      return undefined;
    });
  }
}
