import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import type ICreateTenancyUseCase from '@/modules/tenancy/domain/usecase/create_tenancy.usecase';
import type IListTenanciesUseCase from '@/modules/tenancy/domain/usecase/list_tenancies.usecase';
import CreateTenancyDto from '@/modules/tenancy/dtos/create_tenancy.dto';
import {
  CREATE_TENANCY_SERVICE,
  LIST_TENANCIES_SERVICE,
} from '@/modules/tenancy/symbols';
import {
  Body,
  Controller,
  HttpException,
  Inject,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';

@Controller('api/tenancies')
@UseGuards(AccessTokenGuard)
export default class ProvisioningController {
  constructor(
    @Inject(CREATE_TENANCY_SERVICE)
    private readonly createTenancy: ICreateTenancyUseCase,
    @Inject(LIST_TENANCIES_SERVICE)
    private readonly listTenancies: IListTenanciesUseCase,
  ) {}

  @Get()
  async list(@AuthenticatedUser() user: AccessTokenPayload | undefined) {
    if (!user) throw new HttpException('Unauthorized', 401);
    const result = await this.listTenancies.execute({ role: user.role });
    if (result.isLeft()) {
      throw new HttpException(result.value.message, result.value.statusCode, {
        cause: result.value.cause,
      });
    }
    return result.value;
  }

  @Post()
  async create(
    @Body() body: CreateTenancyDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    if (!user) throw new HttpException('Unauthorized', 401);
    const result = await this.createTenancy.execute({
      ...body,
      cnpj: body.cnpj ?? null,
      creator: { id: user.sub, role: user.role },
    });
    if (result.isLeft()) {
      throw new HttpException(result.value.message, result.value.statusCode, {
        cause: result.value.cause,
      });
    }
    return {
      id: result.value.id,
      name: result.value.name,
      slug: result.value.slug,
      cnpj: result.value.cnpj,
      active: result.value.active,
      createdAt: result.value.createdAt,
      updatedAt: result.value.updatedAt,
    };
  }
}
