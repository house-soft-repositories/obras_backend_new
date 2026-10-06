import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import type ICreateHabiteSeUseCase from '@/modules/obras-privadas/domain/usecase/create_habite_se.usecase';
import type IDeleteHabiteSeUseCase from '@/modules/obras-privadas/domain/usecase/delete_habite_se.usecase';
import type IListHabiteSeUseCase from '@/modules/obras-privadas/domain/usecase/list_habite_se.usecase';
import type IUpdateHabiteSeUseCase from '@/modules/obras-privadas/domain/usecase/update_habite_se.usecase';
import {
  CreateHabiteSeDto,
  UpdateHabiteSeDto,
} from '@/modules/obras-privadas/dtos/habite_se.dto';
import HabiteSeResponseDto from '@/modules/obras-privadas/dtos/habite_se_response.dto';
import {
  CREATE_HABITE_SE_SERVICE,
  DELETE_HABITE_SE_SERVICE,
  LIST_HABITE_SE_SERVICE,
  UPDATE_HABITE_SE_SERVICE,
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

@Controller('api/obras-privadas/:obraPrivadaId/habite-se')
@UseGuards(AccessTokenGuard)
export default class HabiteSeController {
  constructor(
    @Inject(CREATE_HABITE_SE_SERVICE)
    private readonly createHabiteSe: ICreateHabiteSeUseCase,
    @Inject(LIST_HABITE_SE_SERVICE)
    private readonly listHabiteSe: IListHabiteSeUseCase,
    @Inject(UPDATE_HABITE_SE_SERVICE)
    private readonly updateHabiteSe: IUpdateHabiteSeUseCase,
    @Inject(DELETE_HABITE_SE_SERVICE)
    private readonly deleteHabiteSe: IDeleteHabiteSeUseCase,
    private readonly tenantRequestContext: TenantRequestContextService,
  ) {}
  @Post() async create(
    @Param('obraPrivadaId') obraPrivadaId: string,
    @Body() body: CreateHabiteSeDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const tenantId = user?.tenantId;
      if (!tenantId) throw new HttpException('Tenant required', 400);
      if (body.arquivo && !user?.sub) throw new HttpException('Unauthorized', 401);
      const result = await this.createHabiteSe.execute({
        ...body,
        tenantId,
        obraPrivadaId,
        usuarioId: user?.sub,
      });
      if (result.isLeft()) this.throwHttp(result.value);
      return {
        ...HabiteSeResponseDto.fromEntity(result.value.habiteSe),
        arquivoUpload: result.value.arquivo,
      };
    });
  }
  @Get() async list(
    @Param('obraPrivadaId') obraPrivadaId: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const result = await this.listHabiteSe.execute({ obraPrivadaId });
      if (result.isLeft()) this.throwHttp(result.value);
      return result.value.map((entity) =>
        HabiteSeResponseDto.fromEntity(entity),
      );
    });
  }
  @Patch(':id') async update(
    @Param('id') id: string,
    @Body() body: UpdateHabiteSeDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const result = await this.updateHabiteSe.execute({ ...body, id });
      if (result.isLeft()) this.throwHttp(result.value);
      return HabiteSeResponseDto.fromEntity(result.value);
    });
  }
  @Delete(':id') @HttpCode(204) async delete(
    @Param('id') id: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const result = await this.deleteHabiteSe.execute({ id });
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
