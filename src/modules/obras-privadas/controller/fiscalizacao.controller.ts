import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import type ICreateFiscalizacaoUseCase from '@/modules/obras-privadas/domain/usecase/create_fiscalizacao.usecase';
import type IDeleteFiscalizacaoUseCase from '@/modules/obras-privadas/domain/usecase/delete_fiscalizacao.usecase';
import type IDetalharFiscalizacaoUseCase from '@/modules/obras-privadas/domain/usecase/detalhar_fiscalizacao.usecase';
import type IListFiscalizacoesUseCase from '@/modules/obras-privadas/domain/usecase/list_fiscalizacoes.usecase';
import type IUpdateFiscalizacaoUseCase from '@/modules/obras-privadas/domain/usecase/update_fiscalizacao.usecase';
import {
  CreateFiscalizacaoDto,
  UpdateFiscalizacaoDto,
} from '@/modules/obras-privadas/dtos/fiscalizacao.dto';
import FiscalizacaoResponseDto from '@/modules/obras-privadas/dtos/fiscalizacao_response.dto';
import {
  CREATE_FISCALIZACAO_SERVICE,
  DELETE_FISCALIZACAO_SERVICE,
  DETALHAR_FISCALIZACAO_SERVICE,
  LIST_FISCALIZACOES_SERVICE,
  UPDATE_FISCALIZACAO_SERVICE,
} from '@/modules/obras-privadas/symbols';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

@Controller('api/obras-privadas/:obraPrivadaId/fiscalizacoes')
@UseGuards(AccessTokenGuard)
export default class FiscalizacaoController {
  constructor(
    @Inject(CREATE_FISCALIZACAO_SERVICE)
    private readonly createFiscalizacao: ICreateFiscalizacaoUseCase,
    @Inject(LIST_FISCALIZACOES_SERVICE)
    private readonly listFiscalizacoes: IListFiscalizacoesUseCase,
    @Inject(UPDATE_FISCALIZACAO_SERVICE)
    private readonly updateFiscalizacao: IUpdateFiscalizacaoUseCase,
    @Inject(DELETE_FISCALIZACAO_SERVICE)
    private readonly deleteFiscalizacao: IDeleteFiscalizacaoUseCase,
    @Inject(DETALHAR_FISCALIZACAO_SERVICE)
    private readonly detalharFiscalizacao: IDetalharFiscalizacaoUseCase,
    private readonly tenantRequestContext: TenantRequestContextService,
  ) {}

  @Post()
  async create(
    @Param('obraPrivadaId') obraPrivadaId: string,
    @Body() body: CreateFiscalizacaoDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const tenantId = user?.tenantId;
      if (!tenantId) throw new HttpException('Tenant required', 400);
      const fiscalUsuarioId = user.sub;
      const result = await this.createFiscalizacao.execute({
        ...body,
        tenantId,
        obraPrivadaId,
        fiscalUsuarioId,
      });
      if (result.isLeft()) this.throwHttp(result.value);
      return FiscalizacaoResponseDto.fromEntity(result.value);
    });
  }

  @Get()
  async list(
    @Param('obraPrivadaId') obraPrivadaId: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const result = await this.listFiscalizacoes.execute({ obraPrivadaId });
      if (result.isLeft()) this.throwHttp(result.value);
      return result.value.map(FiscalizacaoResponseDto.fromEntity);
    });
  }

  @Get(':id')
  async detalhar(
    @Param('id') id: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const result = await this.detalharFiscalizacao.execute({ id });
      if (result.isLeft()) this.throwHttp(result.value);
      return FiscalizacaoResponseDto.fromEntity(result.value);
    });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateFiscalizacaoDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const result = await this.updateFiscalizacao.execute({ ...body, id });
      if (result.isLeft()) this.throwHttp(result.value);
      return FiscalizacaoResponseDto.fromEntity(result.value);
    });
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(
    @Param('id') id: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const result = await this.deleteFiscalizacao.execute({ id });
      if (result.isLeft()) this.throwHttp(result.value);
    });
  }

  private async withTenant<T>(
    user: AccessTokenPayload | undefined,
    callback: () => Promise<T>,
  ): Promise<T> {
    return this.tenantRequestContext.run(user, callback);
  }
  private throwHttp(error: {
    message: string;
    statusCode: number;
    cause?: unknown;
  }): never {
    throw new HttpException(error.message, error.statusCode, {
      cause: error.cause,
    });
  }
}
