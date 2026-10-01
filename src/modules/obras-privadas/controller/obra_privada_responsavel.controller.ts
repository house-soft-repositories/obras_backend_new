import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import type ICreateObraPrivadaResponsavelUseCase from '@/modules/obras-privadas/domain/usecase/create_obra_privada_responsavel.usecase';
import type IDeleteObraPrivadaResponsavelUseCase from '@/modules/obras-privadas/domain/usecase/delete_obra_privada_responsavel.usecase';
import type IListObraPrivadaResponsaveisUseCase from '@/modules/obras-privadas/domain/usecase/list_obra_privada_responsaveis.usecase';
import type IUpdateObraPrivadaResponsavelUseCase from '@/modules/obras-privadas/domain/usecase/update_obra_privada_responsavel.usecase';
import {
  CreateObraPrivadaResponsavelDto,
  UpdateObraPrivadaResponsavelDto,
} from '@/modules/obras-privadas/dtos/obra_privada_responsavel.dto';
import ObraPrivadaResponsavelResponseDto from '@/modules/obras-privadas/dtos/obra_privada_responsavel_response.dto';
import {
  CREATE_OBRA_PRIVADA_RESPONSAVEL_SERVICE,
  DELETE_OBRA_PRIVADA_RESPONSAVEL_SERVICE,
  LIST_OBRA_PRIVADA_RESPONSAVEIS_SERVICE,
  UPDATE_OBRA_PRIVADA_RESPONSAVEL_SERVICE,
} from '@/modules/obras-privadas/symbols';
import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Get,
  HttpException,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

@Controller('api/obras-privadas/:obraPrivadaId/responsaveis')
@UseGuards(AccessTokenGuard)
export default class ObraPrivadaResponsavelController {
  constructor(
    @Inject(CREATE_OBRA_PRIVADA_RESPONSAVEL_SERVICE)
    private readonly createResponsavel: ICreateObraPrivadaResponsavelUseCase,
    @Inject(LIST_OBRA_PRIVADA_RESPONSAVEIS_SERVICE)
    private readonly listResponsaveis: IListObraPrivadaResponsaveisUseCase,
    @Inject(UPDATE_OBRA_PRIVADA_RESPONSAVEL_SERVICE)
    private readonly updateResponsavel: IUpdateObraPrivadaResponsavelUseCase,
    @Inject(DELETE_OBRA_PRIVADA_RESPONSAVEL_SERVICE)
    private readonly deleteResponsavel: IDeleteObraPrivadaResponsavelUseCase,
    private readonly tenantRequestContext: TenantRequestContextService,
  ) {}
  @Post() async create(
    @Param('obraPrivadaId') obraPrivadaId: string,
    @Body() body: CreateObraPrivadaResponsavelDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const tenantId = user?.tenantId;
      if (!tenantId) throw new HttpException('Tenant required', 400);
      const result = await this.createResponsavel.execute({
        ...body,
        tenantId,
        obraPrivadaId,
      });
      if (result.isLeft()) this.throwHttp(result.value);
      return ObraPrivadaResponsavelResponseDto.fromEntity(result.value);
    });
  }
  @Get() async list(
    @Param('obraPrivadaId') obraPrivadaId: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const result = await this.listResponsaveis.execute({ obraPrivadaId });
      if (result.isLeft()) this.throwHttp(result.value);
      return result.value.map(ObraPrivadaResponsavelResponseDto.fromEntity);
    });
  }
  @Patch(':id') async update(
    @Param('id') id: string,
    @Body() body: UpdateObraPrivadaResponsavelDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const result = await this.updateResponsavel.execute({ ...body, id });
      if (result.isLeft()) this.throwHttp(result.value);
      return ObraPrivadaResponsavelResponseDto.fromEntity(result.value);
    });
  }
  @Delete(':id') @HttpCode(204) async delete(
    @Param('id') id: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const result = await this.deleteResponsavel.execute({ id });
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
