import AppException from '@/core/exceptions/app_exception';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import type { Either } from '@/core/types/either';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import type ICreateLocalidadeUseCase from '@/modules/localidades/domain/usecase/create_localidade.usecase';
import type IListLocalidadesUseCase from '@/modules/localidades/domain/usecase/list_localidades.usecase';
import type IUpdateLocalidadeUseCase from '@/modules/localidades/domain/usecase/update_localidade.usecase';
import CreateLocalidadeDto from '@/modules/localidades/dtos/create_localidade.dto';
import LocalidadeResponseDto from '@/modules/localidades/dtos/localidade_response.dto';
import UpdateLocalidadeDto from '@/modules/localidades/dtos/update_localidade.dto';
import {
  CREATE_LOCALIDADE_SERVICE,
  LIST_LOCALIDADES_SERVICE,
  UPDATE_LOCALIDADE_SERVICE,
} from '@/modules/localidades/symbols';
import {
  Body,
  Controller,
  Get,
  HttpException,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

@Controller('api/localidades')
@UseGuards(AccessTokenGuard)
export default class LocalidadeController {
  constructor(
    @Inject(CREATE_LOCALIDADE_SERVICE)
    private readonly createLocalidade: ICreateLocalidadeUseCase,
    @Inject(LIST_LOCALIDADES_SERVICE)
    private readonly listLocalidades: IListLocalidadesUseCase,
    @Inject(UPDATE_LOCALIDADE_SERVICE)
    private readonly updateLocalidade: IUpdateLocalidadeUseCase,
    private readonly tenantRequestContext: TenantRequestContextService,
  ) {}

  @Post()
  async create(
    @Body() body: CreateLocalidadeDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ): Promise<LocalidadeResponseDto> {
    return this.withTenant(user, async () => {
      const result = await this.createLocalidade.execute({
        ...body,
        role: user!.role,
      });
      return LocalidadeResponseDto.fromEntity(this.unwrap(result));
    });
  }

  @Get()
  async list(
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ): Promise<LocalidadeResponseDto[]> {
    return this.withTenant(user, async () => {
      const result = await this.listLocalidades.execute({ role: user!.role });
      return this.unwrap(result).map((entity) =>
        LocalidadeResponseDto.fromEntity(entity),
      );
    });
  }

  @Patch(':id')
  async update(
    @Param(
      'id',
      new ParseUUIDPipe({
        exceptionFactory: () =>
          new HttpException(ErrorCodeConstants.LOCALIDADE_NOT_FOUND, 404),
      }),
    )
    id: string,
    @Body() body: UpdateLocalidadeDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ): Promise<LocalidadeResponseDto> {
    return this.withTenant(user, async () => {
      const result = await this.updateLocalidade.execute({
        ...body,
        id,
        role: user!.role,
      });
      return LocalidadeResponseDto.fromEntity(this.unwrap(result));
    });
  }

  private async withTenant<T>(
    user: AccessTokenPayload | undefined,
    callback: () => Promise<T>,
  ): Promise<T> {
    try {
      return await this.tenantRequestContext.run(user, callback);
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
