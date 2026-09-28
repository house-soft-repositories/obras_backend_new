import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import type { Either } from '@/core/types/either';
import AppException from '@/core/exceptions/app_exception';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import type BaseFileInterface from '@/modules/attachments/domain/base_file.interface';
import type IConfirmarUploadUseCase from '@/modules/documentos/domain/usecase/confirmar_upload.usecase';
import type IEditarArquivoUseCase from '@/modules/documentos/domain/usecase/editar_arquivo.usecase';
import type IGerarDownloadUseCase from '@/modules/documentos/domain/usecase/gerar_download.usecase';
import type IIniciarUploadUseCase from '@/modules/documentos/domain/usecase/iniciar_upload.usecase';
import type IMoverArquivoUseCase from '@/modules/documentos/domain/usecase/mover_arquivo.usecase';
import type IRemoverArquivoUseCase from '@/modules/documentos/domain/usecase/remover_arquivo.usecase';
import type IUploadDiretoUseCase from '@/modules/documentos/domain/usecase/upload_direto.usecase';
import ArquivoResponseDto from '@/modules/documentos/dtos/arquivo_response.dto';
import ConfirmarUploadDto from '@/modules/documentos/dtos/confirmar_upload.dto';
import EditarArquivoDto from '@/modules/documentos/dtos/editar_arquivo.dto';
import IniciarUploadDto from '@/modules/documentos/dtos/iniciar_upload.dto';
import MoverArquivoDto from '@/modules/documentos/dtos/mover_arquivo.dto';
import {
  CONFIRMAR_UPLOAD_SERVICE,
  EDITAR_ARQUIVO_SERVICE,
  GERAR_DOWNLOAD_SERVICE,
  INICIAR_UPLOAD_SERVICE,
  MOVER_ARQUIVO_SERVICE,
  REMOVER_ARQUIVO_SERVICE,
  UPLOAD_DIRETO_SERVICE,
} from '@/modules/documentos/symbols';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

const memoryUpload = { storage: memoryStorage() };

function toBaseFile(file: Express.Multer.File): BaseFileInterface {
  return {
    buffer: file.buffer,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    encoding: file.encoding,
  };
}

@Controller('api')
@UseGuards(AccessTokenGuard)
export default class ArquivosController {
  constructor(
    @Inject(INICIAR_UPLOAD_SERVICE)
    private readonly iniciar: IIniciarUploadUseCase,
    @Inject(UPLOAD_DIRETO_SERVICE)
    private readonly direto: IUploadDiretoUseCase,
    @Inject(CONFIRMAR_UPLOAD_SERVICE)
    private readonly confirmarUpload: IConfirmarUploadUseCase,
    @Inject(GERAR_DOWNLOAD_SERVICE)
    private readonly download: IGerarDownloadUseCase,
    @Inject(EDITAR_ARQUIVO_SERVICE)
    private readonly editar: IEditarArquivoUseCase,
    @Inject(MOVER_ARQUIVO_SERVICE)
    private readonly mover: IMoverArquivoUseCase,
    @Inject(REMOVER_ARQUIVO_SERVICE)
    private readonly remover: IRemoverArquivoUseCase,
    private readonly tenantContext: TenantRequestContextService,
  ) {}

  @Post('pastas/:pastaId/arquivos')
  async iniciarUpload(
    @Param('pastaId', ParseUUIDPipe) pastaId: string,
    @Body() body: IniciarUploadDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const r = await this.iniciar.execute({
        pastaId,
        arquivos: body.arquivos,
        usuarioId: user?.sub ?? '',
      });
      return this.unwrap(r);
    });
  }

  @Post('pastas/:pastaId/arquivos/direto')
  @UseInterceptors(FilesInterceptor('files', 20, memoryUpload))
  async uploadDireto(
    @Param('pastaId', ParseUUIDPipe) pastaId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const r = await this.direto.execute({
        pastaId,
        files: (files ?? []).map(toBaseFile),
        usuarioId: user?.sub ?? '',
      });
      return this.unwrap(r).map((e) => ArquivoResponseDto.fromEntity(e));
    });
  }

  @Post('arquivos/:arquivoId/confirmar')
  async confirmar(
    @Param('arquivoId', ParseUUIDPipe) arquivoId: string,
    @Body() body: ConfirmarUploadDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const r = await this.confirmarUpload.execute({
        arquivoId,
        tamanhoBytes: body.tamanhoBytes,
        mimeType: body.mimeType,
      });
      return ArquivoResponseDto.fromEntity(this.unwrap(r));
    });
  }

  @Get('arquivos/:arquivoId/download')
  async gerarDownload(
    @Param('arquivoId', ParseUUIDPipe) arquivoId: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const r = await this.download.execute({ arquivoId });
      return this.unwrap(r);
    });
  }

  @Patch('arquivos/:arquivoId')
  async editarArquivo(
    @Param('arquivoId', ParseUUIDPipe) arquivoId: string,
    @Body() body: EditarArquivoDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const r = await this.editar.execute({
        arquivoId,
        nome: body.nome,
        descricao: body.descricao,
        usuarioId: user?.sub ?? '',
      });
      return ArquivoResponseDto.fromEntity(this.unwrap(r));
    });
  }

  @Patch('arquivos/:arquivoId/mover')
  async moverArquivo(
    @Param('arquivoId', ParseUUIDPipe) arquivoId: string,
    @Body() body: MoverArquivoDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const r = await this.mover.execute({
        arquivoId,
        pastaDestinoId: body.pastaId,
        usuarioId: user?.sub ?? '',
      });
      return ArquivoResponseDto.fromEntity(this.unwrap(r));
    });
  }

  @Delete('arquivos/:arquivoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removerArquivo(
    @Param('arquivoId', ParseUUIDPipe) arquivoId: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const r = await this.remover.execute({ arquivoId });
      this.unwrap(r);
      return;
    });
  }

  private async withTenant<T>(
    user: AccessTokenPayload | undefined,
    callback: () => Promise<T>,
  ): Promise<T> {
    try {
      return await this.tenantContext.run(user, callback);
    } catch (error) {
      if (error instanceof AppException) this.throwHttp(error);
      throw error;
    }
  }

  private unwrap<T>(result: Either<AppException, T>): T {
    if (result.isLeft()) this.throwHttp(result.value);
    return result.value;
  }

  private throwHttp(error: AppException): never {
    throw new HttpException(error.message, error.statusCode, {
      cause: error.cause,
    });
  }
}
