import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import type ICreateAlvaraUseCase from '@/modules/obras-privadas/domain/usecase/create_alvara.usecase';
import type IDeleteAlvaraUseCase from '@/modules/obras-privadas/domain/usecase/delete_alvara.usecase';
import type IListAlvarasUseCase from '@/modules/obras-privadas/domain/usecase/list_alvaras.usecase';
import type IUpdateAlvaraUseCase from '@/modules/obras-privadas/domain/usecase/update_alvara.usecase';
import {
  CreateAlvaraDto,
  UpdateAlvaraDto,
} from '@/modules/obras-privadas/dtos/alvara.dto';
import AlvaraResponseDto from '@/modules/obras-privadas/dtos/alvara_response.dto';
import {
  CREATE_ALVARA_SERVICE,
  DELETE_ALVARA_SERVICE,
  LIST_ALVARAS_SERVICE,
  UPDATE_ALVARA_SERVICE,
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

@Controller('api/obras-privadas/:obraPrivadaId/alvaras')
@UseGuards(AccessTokenGuard)
export default class AlvaraController {
  constructor(
    @Inject(CREATE_ALVARA_SERVICE)
    private readonly createAlvara: ICreateAlvaraUseCase,
    @Inject(LIST_ALVARAS_SERVICE)
    private readonly listAlvaras: IListAlvarasUseCase,
    @Inject(UPDATE_ALVARA_SERVICE)
    private readonly updateAlvara: IUpdateAlvaraUseCase,
    @Inject(DELETE_ALVARA_SERVICE)
    private readonly deleteAlvara: IDeleteAlvaraUseCase,
    private readonly tenantRequestContext: TenantRequestContextService,
  ) {}

  @Post()
  async create(
    @Param('obraPrivadaId') obraPrivadaId: string,
    @Body() body: CreateAlvaraDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const tenantId = user?.tenantId;
      if (!tenantId) throw new HttpException('Tenant required', 400);
      const result = await this.createAlvara.execute({
        ...body,
        tenantId,
        obraPrivadaId,
      });
      if (result.isLeft()) this.throwHttp(result.value);
      return AlvaraResponseDto.fromEntity(result.value);
    });
  }

  @Get()
  async list(
    @Param('obraPrivadaId') obraPrivadaId: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const result = await this.listAlvaras.execute({ obraPrivadaId });
      if (result.isLeft()) this.throwHttp(result.value);
      return result.value.map(AlvaraResponseDto.fromEntity);
    });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateAlvaraDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const result = await this.updateAlvara.execute({ ...body, id });
      if (result.isLeft()) this.throwHttp(result.value);
      return AlvaraResponseDto.fromEntity(result.value);
    });
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(
    @Param('id') id: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const result = await this.deleteAlvara.execute({ id });
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
