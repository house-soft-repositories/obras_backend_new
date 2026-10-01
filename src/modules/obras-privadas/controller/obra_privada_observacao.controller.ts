import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import type ICreateObraPrivadaObservacaoUseCase from '@/modules/obras-privadas/domain/usecase/create_obra_privada_observacao.usecase';
import type IDeleteObraPrivadaObservacaoUseCase from '@/modules/obras-privadas/domain/usecase/delete_obra_privada_observacao.usecase';
import type IListObraPrivadaObservacoesUseCase from '@/modules/obras-privadas/domain/usecase/list_obra_privada_observacoes.usecase';
import { CreateObraPrivadaObservacaoDto } from '@/modules/obras-privadas/dtos/obra_privada_observacao.dto';
import ObraPrivadaObservacaoResponseDto from '@/modules/obras-privadas/dtos/obra_privada_observacao_response.dto';
import {
  CREATE_OBRA_PRIVADA_OBSERVACAO_SERVICE,
  DELETE_OBRA_PRIVADA_OBSERVACAO_SERVICE,
  LIST_OBRA_PRIVADA_OBSERVACOES_SERVICE,
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
  Post,
  UseGuards,
} from '@nestjs/common';

@Controller('api/obras-privadas/:obraPrivadaId/observacoes')
@UseGuards(AccessTokenGuard)
export default class ObraPrivadaObservacaoController {
  constructor(
    @Inject(CREATE_OBRA_PRIVADA_OBSERVACAO_SERVICE)
    private readonly createObservacao: ICreateObraPrivadaObservacaoUseCase,
    @Inject(LIST_OBRA_PRIVADA_OBSERVACOES_SERVICE)
    private readonly listObservacoes: IListObraPrivadaObservacoesUseCase,
    @Inject(DELETE_OBRA_PRIVADA_OBSERVACAO_SERVICE)
    private readonly deleteObservacao: IDeleteObraPrivadaObservacaoUseCase,
    private readonly tenantRequestContext: TenantRequestContextService,
  ) {}

  @Post()
  async create(
    @Param('obraPrivadaId') obraPrivadaId: string,
    @Body() body: CreateObraPrivadaObservacaoDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const tenantId = user?.tenantId;
      if (!tenantId) throw new HttpException('Tenant required', 400);
      const result = await this.createObservacao.execute({
        ...body,
        tenantId,
        obraPrivadaId,
        autorUsuarioId: user.sub,
      });
      if (result.isLeft()) this.throwHttp(result.value);
      return ObraPrivadaObservacaoResponseDto.fromEntity(result.value);
    });
  }

  @Get()
  async list(
    @Param('obraPrivadaId') obraPrivadaId: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const result = await this.listObservacoes.execute({ obraPrivadaId });
      if (result.isLeft()) this.throwHttp(result.value);
      return result.value.map(ObraPrivadaObservacaoResponseDto.fromEntity);
    });
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(
    @Param('id') id: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const result = await this.deleteObservacao.execute({ id });
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
