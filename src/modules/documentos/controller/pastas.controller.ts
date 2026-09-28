import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import PaginationOptionsDto from '@/core/pagination/dto/pagination_options.dto';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import type { Either } from '@/core/types/either';
import AppException from '@/core/exceptions/app_exception';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import type ICriarPastaUseCase from '@/modules/documentos/domain/usecase/criar_pasta.usecase';
import type IGarantirPastaRaizUseCase from '@/modules/documentos/domain/usecase/garantir_pasta_raiz.usecase';
import type IListarConteudoUseCase from '@/modules/documentos/domain/usecase/listar_conteudo.usecase';
import type IRemoverPastaUseCase from '@/modules/documentos/domain/usecase/remover_pasta.usecase';
import ConteudoPastaResponseDto from '@/modules/documentos/dtos/conteudo_pasta_response.dto';
import CreatePastaDto from '@/modules/documentos/dtos/create_pasta.dto';
import PastaResponseDto from '@/modules/documentos/dtos/pasta_response.dto';
import {
  CRIAR_PASTA_SERVICE,
  GARANTIR_PASTA_RAIZ_SERVICE,
  LISTAR_CONTEUDO_SERVICE,
  REMOVER_PASTA_SERVICE,
} from '@/modules/documentos/symbols';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  HttpException,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

@Controller('api')
@UseGuards(AccessTokenGuard)
export default class PastasController {
  constructor(
    @Inject(GARANTIR_PASTA_RAIZ_SERVICE)
    private readonly garantirRaiz: IGarantirPastaRaizUseCase,
    @Inject(CRIAR_PASTA_SERVICE)
    private readonly criar: ICriarPastaUseCase,
    @Inject(LISTAR_CONTEUDO_SERVICE)
    private readonly conteudo: IListarConteudoUseCase,
    @Inject(REMOVER_PASTA_SERVICE)
    private readonly remover: IRemoverPastaUseCase,
    private readonly tenantContext: TenantRequestContextService,
  ) {}

  @Get('obras/:obraId/pastas/raiz')
  async raiz(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const r = await this.garantirRaiz.execute({ obraId });
      return PastaResponseDto.fromEntity(this.unwrap(r));
    });
  }

  @Get('pastas/:pastaId')
  async conteudoPasta(
    @Param('pastaId', ParseUUIDPipe) pastaId: string,
    @Query() q: PaginationOptionsDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const r = await this.conteudo.execute({
        pastaId,
        pageOptions: new PageOptionsEntity(q.order, q.page, q.take),
      });
      return ConteudoPastaResponseDto.fromConteudo(this.unwrap(r));
    });
  }

  @Post('pastas')
  async criarPasta(
    @Body() body: CreatePastaDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const r = await this.criar.execute({
        pastaPaiId: body.pastaPaiId,
        nome: body.nome,
        usuarioId: user?.sub ?? '',
      });
      return PastaResponseDto.fromEntity(this.unwrap(r));
    });
  }

  @Delete('pastas/:pastaId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removerPasta(
    @Param('pastaId', ParseUUIDPipe) pastaId: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const r = await this.remover.execute({ pastaId });
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
