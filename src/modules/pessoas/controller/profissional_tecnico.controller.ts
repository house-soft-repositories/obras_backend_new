import AppException from '@/core/exceptions/app_exception';
import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import type { Either } from '@/core/types/either';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import type IBuscarProfissionaisTecnicosUseCase from '@/modules/pessoas/domain/usecase/buscar_profissionais_tecnicos.usecase';
import type ICreateProfissionalTecnicoUseCase from '@/modules/pessoas/domain/usecase/create_profissional_tecnico.usecase';
import type IGetProfissionalTecnicoUseCase from '@/modules/pessoas/domain/usecase/get_profissional_tecnico.usecase';
import type IListProfissionaisTecnicosUseCase from '@/modules/pessoas/domain/usecase/list_profissionais_tecnicos.usecase';
import type IUpdateProfissionalTecnicoUseCase from '@/modules/pessoas/domain/usecase/update_profissional_tecnico.usecase';
import BuscarProfissionalTecnicoQueryDto from '@/modules/pessoas/dtos/buscar_profissional_tecnico_query.dto';
import CreateProfissionalTecnicoDto from '@/modules/pessoas/dtos/create_profissional_tecnico.dto';
import ProfissionalTecnicoResponseDto from '@/modules/pessoas/dtos/profissional_tecnico_response.dto';
import UpdateProfissionalTecnicoDto from '@/modules/pessoas/dtos/update_profissional_tecnico.dto';
import {
  BUSCAR_PROFISSIONAIS_TECNICOS_SERVICE,
  CREATE_PROFISSIONAL_TECNICO_SERVICE,
  GET_PROFISSIONAL_TECNICO_SERVICE,
  LIST_PROFISSIONAIS_TECNICOS_SERVICE,
  UPDATE_PROFISSIONAL_TECNICO_SERVICE,
} from '@/modules/pessoas/symbols';
import {
  Body,
  Controller,
  Get,
  HttpException,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

@Controller('api/profissionais-tecnicos')
@UseGuards(AccessTokenGuard)
export default class ProfissionalTecnicoController {
  constructor(
    @Inject(CREATE_PROFISSIONAL_TECNICO_SERVICE)
    private readonly create: ICreateProfissionalTecnicoUseCase,
    @Inject(LIST_PROFISSIONAIS_TECNICOS_SERVICE)
    private readonly list: IListProfissionaisTecnicosUseCase,
    @Inject(BUSCAR_PROFISSIONAIS_TECNICOS_SERVICE)
    private readonly buscar: IBuscarProfissionaisTecnicosUseCase,
    @Inject(GET_PROFISSIONAL_TECNICO_SERVICE)
    private readonly get: IGetProfissionalTecnicoUseCase,
    @Inject(UPDATE_PROFISSIONAL_TECNICO_SERVICE)
    private readonly update: IUpdateProfissionalTecnicoUseCase,
    private readonly tenantContext: TenantRequestContextService,
  ) {}

  @Post()
  async createProfissionalTecnico(
    @Body() body: CreateProfissionalTecnicoDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const result = await this.create.execute(body);
      return ProfissionalTecnicoResponseDto.fromView(this.unwrap(result));
    });
  }

  @Get()
  async listProfissionaisTecnicos(
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const result = await this.list.execute();
      return this.unwrap(result).map((item) =>
        ProfissionalTecnicoResponseDto.fromView(item),
      );
    });
  }

  @Get('busca')
  async buscarProfissionaisTecnicos(
    @Query() query: BuscarProfissionalTecnicoQueryDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const result = await this.buscar.execute({ ...query });
      const page = this.unwrap(result);
      return {
        data: page.pageData.map((item) =>
          ProfissionalTecnicoResponseDto.fromView(item),
        ),
        meta: page.pageMeta,
      };
    });
  }

  @Get(':id')
  async getProfissionalTecnico(
    @Param('id') id: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const result = await this.get.execute({ id });
      return ProfissionalTecnicoResponseDto.fromView(this.unwrap(result));
    });
  }

  @Patch(':id')
  async updateProfissionalTecnico(
    @Param('id') id: string,
    @Body() body: UpdateProfissionalTecnicoDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const result = await this.update.execute({ id, data: body });
      return ProfissionalTecnicoResponseDto.fromView(this.unwrap(result));
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
