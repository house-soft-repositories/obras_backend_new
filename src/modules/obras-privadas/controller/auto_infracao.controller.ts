import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import type ICreateAutoInfracaoUseCase from '@/modules/obras-privadas/domain/usecase/create_auto_infracao.usecase';
import type IListAutosInfracaoUseCase from '@/modules/obras-privadas/domain/usecase/list_autos_infracao.usecase';
import type IUpdateAutoInfracaoUseCase from '@/modules/obras-privadas/domain/usecase/update_auto_infracao.usecase';
import {
  CreateAutoInfracaoDto,
  UpdateAutoInfracaoDto,
} from '@/modules/obras-privadas/dtos/auto_infracao.dto';
import AutoInfracaoResponseDto from '@/modules/obras-privadas/dtos/auto_infracao_response.dto';
import {
  CREATE_AUTO_INFRACAO_SERVICE,
  LIST_AUTOS_INFRACAO_SERVICE,
  UPDATE_AUTO_INFRACAO_SERVICE,
} from '@/modules/obras-privadas/symbols';
import {
  Body,
  Controller,
  Get,
  HttpException,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

@Controller('api/obras-privadas/:obraPrivadaId/autos')
@UseGuards(AccessTokenGuard)
export default class AutoInfracaoController {
  constructor(
    @Inject(CREATE_AUTO_INFRACAO_SERVICE)
    private readonly createAuto: ICreateAutoInfracaoUseCase,
    @Inject(LIST_AUTOS_INFRACAO_SERVICE)
    private readonly listAutos: IListAutosInfracaoUseCase,
    @Inject(UPDATE_AUTO_INFRACAO_SERVICE)
    private readonly updateAuto: IUpdateAutoInfracaoUseCase,
    private readonly tenantRequestContext: TenantRequestContextService,
  ) {}
  @Post() async create(
    @Param('obraPrivadaId') obraPrivadaId: string,
    @Body() body: CreateAutoInfracaoDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const tenantId = user?.tenantId;
      if (!tenantId) throw new HttpException('Tenant required', 400);
      const result = await this.createAuto.execute({
        ...body,
        tenantId,
        obraPrivadaId,
        lavradoPorUsuarioId: user.sub,
      });
      if (result.isLeft()) this.throwHttp(result.value);
      return AutoInfracaoResponseDto.fromEntity(result.value);
    });
  }
  @Get() async list(
    @Param('obraPrivadaId') obraPrivadaId: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const result = await this.listAutos.execute({ obraPrivadaId });
      if (result.isLeft()) this.throwHttp(result.value);
      return result.value.map(AutoInfracaoResponseDto.fromEntity);
    });
  }
  @Patch(':id') async update(
    @Param('id') id: string,
    @Body() body: UpdateAutoInfracaoDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const result = await this.updateAuto.execute({ ...body, id });
      if (result.isLeft()) this.throwHttp(result.value);
      return AutoInfracaoResponseDto.fromEntity(result.value);
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
