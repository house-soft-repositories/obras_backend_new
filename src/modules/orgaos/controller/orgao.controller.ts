import AppException from '@/core/exceptions/app_exception';
import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import PaginationOptionsDto from '@/core/pagination/dto/pagination_options.dto';
import type { Either } from '@/core/types/either';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import type ICreateOrgaoUseCase from '@/modules/orgaos/domain/usecase/create_orgao.usecase';
import type ICreateSetorUseCase from '@/modules/orgaos/domain/usecase/create_setor.usecase';
import type IListOrgaosByLocalidadeUseCase from '@/modules/orgaos/domain/usecase/list_orgaos_by_localidade.usecase';
import type IListOrgaosUseCase from '@/modules/orgaos/domain/usecase/list_orgaos.usecase';
import type IListSetoresUseCase from '@/modules/orgaos/domain/usecase/list_setores.usecase';
import type IListSetoresByOrgaoUseCase from '@/modules/orgaos/domain/usecase/list_setores_by_orgao.usecase';
import type IUpdateOrgaoUseCase from '@/modules/orgaos/domain/usecase/update_orgao.usecase';
import type IUpdateSetorUseCase from '@/modules/orgaos/domain/usecase/update_setor.usecase';
import CreateOrgaoDto from '@/modules/orgaos/dtos/create_orgao.dto';
import CreateSetorDto from '@/modules/orgaos/dtos/create_setor.dto';
import OrgaoResponseDto from '@/modules/orgaos/dtos/orgao_response.dto';
import SetorResponseDto from '@/modules/orgaos/dtos/setor_response.dto';
import UpdateOrgaoDto from '@/modules/orgaos/dtos/update_orgao.dto';
import UpdateSetorDto from '@/modules/orgaos/dtos/update_setor.dto';
import {
  CREATE_ORGAO_SERVICE,
  CREATE_SETOR_SERVICE,
  LIST_ORGAOS_BY_LOCALIDADE_SERVICE,
  LIST_ORGAOS_SERVICE,
  LIST_SETORES_SERVICE,
  LIST_SETORES_BY_ORGAO_SERVICE,
  UPDATE_ORGAO_SERVICE,
  UPDATE_SETOR_SERVICE,
} from '@/modules/orgaos/symbols';
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
  Query,
  UseGuards,
} from '@nestjs/common';

@Controller('api/orgaos')
@UseGuards(AccessTokenGuard)
export default class OrgaoController {
  constructor(
    @Inject(CREATE_ORGAO_SERVICE)
    private readonly createOrgao: ICreateOrgaoUseCase,
    @Inject(LIST_ORGAOS_SERVICE)
    private readonly listOrgaos: IListOrgaosUseCase,
    @Inject(LIST_ORGAOS_BY_LOCALIDADE_SERVICE)
    private readonly listOrgaosByLocalidade: IListOrgaosByLocalidadeUseCase,
    @Inject(UPDATE_ORGAO_SERVICE)
    private readonly updateOrgao: IUpdateOrgaoUseCase,
    @Inject(CREATE_SETOR_SERVICE)
    private readonly createSetor: ICreateSetorUseCase,
    @Inject(LIST_SETORES_SERVICE)
    private readonly listSetores: IListSetoresUseCase,
    @Inject(LIST_SETORES_BY_ORGAO_SERVICE)
    private readonly listSetoresByOrgaoUseCase: IListSetoresByOrgaoUseCase,
    @Inject(UPDATE_SETOR_SERVICE)
    private readonly updateSetor: IUpdateSetorUseCase,
    private readonly tenantRequestContext: TenantRequestContextService,
  ) {}

  @Post()
  async create(
    @Body() body: CreateOrgaoDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ): Promise<OrgaoResponseDto> {
    return this.withTenant(user, async () => {
      const result = await this.createOrgao.execute({
        ...body,
        role: user!.role,
      });
      return OrgaoResponseDto.fromEntity(this.unwrap(result));
    });
  }

  @Get()
  async list(
    @Query() query: PaginationOptionsDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const result = await this.listOrgaos.execute({
        ...query,
        role: user!.role,
      });
      const page = this.unwrap(result);
      return {
        data: page.pageData.map((entity) =>
          OrgaoResponseDto.fromEntity(entity),
        ),
        meta: page.pageMeta,
      };
    });
  }

  @Get('localidade/:localidadeId')
  async listByLocalidade(
    @Param('localidadeId', ParseUUIDPipe) localidadeId: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ): Promise<OrgaoResponseDto[]> {
    return this.withTenant(user, async () => {
      const result = await this.listOrgaosByLocalidade.execute({
        localidadeId,
        role: user!.role,
      });
      return this.unwrap(result).map((entity) =>
        OrgaoResponseDto.fromEntity(entity),
      );
    });
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateOrgaoDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ): Promise<OrgaoResponseDto> {
    return this.withTenant(user, async () => {
      const result = await this.updateOrgao.execute({
        ...body,
        id,
        role: user!.role,
      });
      return OrgaoResponseDto.fromEntity(this.unwrap(result));
    });
  }

  @Get('setores')
  async listSetoresForOrgao(
    @Query() query: PaginationOptionsDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const result = await this.listSetores.execute({
        ...query,
        role: user!.role,
      });
      const page = this.unwrap(result);

      return page.toObject();
    });
  }

  @Post(':orgaoId/setores')
  async createSetorForOrgao(
    @Param('orgaoId', ParseUUIDPipe) orgaoId: string,
    @Body() body: CreateSetorDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ): Promise<SetorResponseDto> {
    return this.withTenant(user, async () => {
      const result = await this.createSetor.execute({
        ...body,
        orgaoId,
        role: user!.role,
      });
      return SetorResponseDto.fromEntity(this.unwrap(result));
    });
  }

  @Get(':orgaoId/setores')
  async listSetoresByOrgao(
    @Param('orgaoId', ParseUUIDPipe) orgaoId: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const result = await this.listSetoresByOrgaoUseCase.execute({
        orgaoId,
        role: user!.role,
      });
      return this.unwrap(result);
    });
  }

  @Patch(':orgaoId/setores/:id')
  async updateSetorForOrgao(
    @Param('orgaoId', ParseUUIDPipe) orgaoId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateSetorDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ): Promise<SetorResponseDto> {
    return this.withTenant(user, async () => {
      const result = await this.updateSetor.execute({
        ...body,
        id,
        orgaoId: body.orgaoId ?? orgaoId,
        role: user!.role,
      });
      return SetorResponseDto.fromEntity(this.unwrap(result));
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
