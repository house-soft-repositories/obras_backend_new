import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import type { Either } from '@/core/types/either';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import type ICreateFonteUseCase from '@/modules/fontes/domain/usecase/create_fonte.usecase';
import type IDeleteFonteUseCase from '@/modules/fontes/domain/usecase/delete_fonte.usecase';
import type IGetFonteUseCase from '@/modules/fontes/domain/usecase/get_fonte.usecase';
import type IListFontesUseCase from '@/modules/fontes/domain/usecase/list_fontes.usecase';
import type IUpdateFonteUseCase from '@/modules/fontes/domain/usecase/update_fonte.usecase';
import CreateFonteDto from '@/modules/fontes/dtos/create_fonte.dto';
import FonteResponseDto from '@/modules/fontes/dtos/fonte_response.dto';
import ListFontesDto from '@/modules/fontes/dtos/list_fontes.dto';
import UpdateFonteDto from '@/modules/fontes/dtos/update_fonte.dto';
import {
  CREATE_FONTE_SERVICE,
  DELETE_FONTE_SERVICE,
  GET_FONTE_SERVICE,
  LIST_FONTES_SERVICE,
  UPDATE_FONTE_SERVICE,
} from '@/modules/fontes/symbols';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

@Controller('api/fontes')
@UseGuards(AccessTokenGuard)
export default class FonteController {
  constructor(
    @Inject(CREATE_FONTE_SERVICE)
    private readonly create: ICreateFonteUseCase,
    @Inject(LIST_FONTES_SERVICE)
    private readonly list: IListFontesUseCase,
    @Inject(GET_FONTE_SERVICE)
    private readonly get: IGetFonteUseCase,
    @Inject(UPDATE_FONTE_SERVICE)
    private readonly update: IUpdateFonteUseCase,
    @Inject(DELETE_FONTE_SERVICE)
    private readonly deleteFonte: IDeleteFonteUseCase,
    private readonly tenantContext: TenantRequestContextService,
  ) {}

  @Post()
  async createFonte(
    @Body() body: CreateFonteDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ): Promise<FonteResponseDto> {
    return this.withTenant(user, async () => {
      const result = await this.create.execute({ ...body });
      return FonteResponseDto.fromEntity(this.unwrap(result));
    });
  }

  @Get()
  async listFontes(
    @Query() query: ListFontesDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.withTenant(user, async () => {
      const result = await this.list.execute({ ...query });
      const page = this.unwrap(result);
      return {
        data: page.pageData.map((entity) =>
          FonteResponseDto.fromEntity(entity),
        ),
        meta: page.pageMeta,
      };
    });
  }

  @Get(':id')
  async getFonte(
    @Param('id', new ParseUUIDPipe({ exceptionFactory: () => new HttpException(ErrorCodeConstants.FONTE_NOT_FOUND, 404) }))
    id: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ): Promise<FonteResponseDto> {
    return this.withTenant(user, async () => {
      const result = await this.get.execute({ id });
      return FonteResponseDto.fromEntity(this.unwrap(result));
    });
  }

  @Patch(':id')
  async updateFonte(
    @Param('id', new ParseUUIDPipe({ exceptionFactory: () => new HttpException(ErrorCodeConstants.FONTE_NOT_FOUND, 404) }))
    id: string,
    @Body() body: UpdateFonteDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ): Promise<FonteResponseDto> {
    return this.withTenant(user, async () => {
      const result = await this.update.execute({ ...body, id });
      return FonteResponseDto.fromEntity(this.unwrap(result));
    });
  }

  @Delete(':id')
  @HttpCode(204)
  async removeFonte(
    @Param('id', new ParseUUIDPipe({ exceptionFactory: () => new HttpException(ErrorCodeConstants.FONTE_NOT_FOUND, 404) }))
    id: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ): Promise<void> {
    return this.withTenant(user, async () => {
      const result = await this.deleteFonte.execute({ id });
      this.unwrap(result);
    });
  }

  private async withTenant<T>(
    user: AccessTokenPayload | undefined,
    cb: () => Promise<T>,
  ): Promise<T> {
    try {
      return await this.tenantContext.run(user, cb);
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
