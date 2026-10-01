import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import type IConfirmarUploadArquivoUseCase from '@/modules/obras-privadas/domain/usecase/confirmar_upload_arquivo.usecase';
import type IEditarArquivoUseCase from '@/modules/obras-privadas/domain/usecase/editar_arquivo.usecase';
import type IExcluirArquivoUseCase from '@/modules/obras-privadas/domain/usecase/excluir_arquivo.usecase';
import type IObterArquivoDownloadUrlUseCase from '@/modules/obras-privadas/domain/usecase/obter_arquivo_download_url.usecase';
import {
  AtualizarArquivoDto,
  ConfirmarUploadArquivoDto,
} from '@/modules/obras-privadas/dtos/obra_privada_arquivo.dto';
import ObraPrivadaArquivoResponseDto from '@/modules/obras-privadas/dtos/obra_privada_arquivo_response.dto';
import {
  CONFIRMAR_UPLOAD_ARQUIVO_SERVICE,
  EDITAR_ARQUIVO_SERVICE,
  EXCLUIR_ARQUIVO_SERVICE,
  OBTER_ARQUIVO_DOWNLOAD_URL_SERVICE,
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

@Controller('api/obras-privadas-arquivos')
@UseGuards(AccessTokenGuard)
export default class ArquivoPrivadoController {
  constructor(
    @Inject(CONFIRMAR_UPLOAD_ARQUIVO_SERVICE)
    private readonly confirmarUpload: IConfirmarUploadArquivoUseCase,
    @Inject(OBTER_ARQUIVO_DOWNLOAD_URL_SERVICE)
    private readonly downloadUrl: IObterArquivoDownloadUrlUseCase,
    @Inject(EDITAR_ARQUIVO_SERVICE)
    private readonly editarArquivo: IEditarArquivoUseCase,
    @Inject(EXCLUIR_ARQUIVO_SERVICE)
    private readonly excluirArquivo: IExcluirArquivoUseCase,
    private readonly tenantRequestContext: TenantRequestContextService,
  ) {}

  @Post(':id/confirmar')
  async confirmar(
    @Param('id') id: string,
    @Body() body: ConfirmarUploadArquivoDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const result = await this.confirmarUpload.execute({ ...body, id });
      if (result.isLeft()) this.throwHttp(result.value);
      return ObraPrivadaArquivoResponseDto.fromEntity(result.value);
    });
  }

  @Get(':id/url')
  async url(
    @Param('id') id: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const result = await this.downloadUrl.execute({ id });
      if (result.isLeft()) this.throwHttp(result.value);
      return result.value;
    });
  }

  @Patch(':id')
  async editar(
    @Param('id') id: string,
    @Body() body: AtualizarArquivoDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const result = await this.editarArquivo.execute({ ...body, id });
      if (result.isLeft()) this.throwHttp(result.value);
      return ObraPrivadaArquivoResponseDto.fromEntity(result.value);
    });
  }

  @Delete(':id')
  @HttpCode(204)
  async excluir(
    @Param('id') id: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const result = await this.excluirArquivo.execute({ id });
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
