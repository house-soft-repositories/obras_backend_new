import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import type IIniciarUploadArquivoUseCase from '@/modules/obras-privadas/domain/usecase/iniciar_upload_arquivo.usecase';
import type IListarArquivosUseCase from '@/modules/obras-privadas/domain/usecase/listar_arquivos.usecase';
import {
  IniciarUploadArquivoDto,
  ListarArquivosQueryDto,
} from '@/modules/obras-privadas/dtos/obra_privada_arquivo.dto';
import ObraPrivadaArquivoResponseDto from '@/modules/obras-privadas/dtos/obra_privada_arquivo_response.dto';
import {
  INICIAR_UPLOAD_ARQUIVO_SERVICE,
  LISTAR_ARQUIVOS_SERVICE,
} from '@/modules/obras-privadas/symbols';
import {
  Body,
  Controller,
  Get,
  HttpException,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

@Controller('api/obras-privadas/:obraPrivadaId/arquivos')
@UseGuards(AccessTokenGuard)
export default class ObraPrivadaArquivoController {
  constructor(
    @Inject(INICIAR_UPLOAD_ARQUIVO_SERVICE)
    private readonly iniciarUpload: IIniciarUploadArquivoUseCase,
    @Inject(LISTAR_ARQUIVOS_SERVICE)
    private readonly listarArquivos: IListarArquivosUseCase,
    private readonly tenantRequestContext: TenantRequestContextService,
  ) {}

  @Post()
  async iniciar(
    @Param('obraPrivadaId') obraPrivadaId: string,
    @Body() body: IniciarUploadArquivoDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      if (!user?.sub) throw new HttpException('Unauthorized', 401);
      const result = await this.iniciarUpload.execute({
        ...body,
        obraPrivadaId,
        usuarioId: user.sub,
      });
      if (result.isLeft()) this.throwHttp(result.value);
      return result.value;
    });
  }

  @Get()
  async listar(
    @Param('obraPrivadaId') obraPrivadaId: string,
    @Query() query: ListarArquivosQueryDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const result = await this.listarArquivos.execute({
        obraPrivadaId,
        ...query,
      });
      if (result.isLeft()) this.throwHttp(result.value);
      return result.value.map(ObraPrivadaArquivoResponseDto.fromEntity);
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
