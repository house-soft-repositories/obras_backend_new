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
import AppException from '@/core/exceptions/app_exception';
import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import PaginationOptionsDto from '@/core/pagination/dto/pagination_options.dto';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import { Either } from '@/core/types/either';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import {
  CREATE_MEDICAO_SERVICE,
  LIST_MEDICOES_SERVICE,
  GET_MEDICAO_SERVICE,
  UPDATE_MEDICAO_SERVICE,
  REMOVE_MEDICAO_SERVICE,
} from '@/modules/cronograma/symbols';
import type ICreateMedicaoUseCase from '@/modules/cronograma/domain/usecase/create_medicao.usecase';
import type IListMedicoesUseCase from '@/modules/cronograma/domain/usecase/list_medicoes.usecase';
import type IGetMedicaoUseCase from '@/modules/cronograma/domain/usecase/get_medicao.usecase';
import type IUpdateMedicaoUseCase from '@/modules/cronograma/domain/usecase/update_medicao.usecase';
import type IRemoveMedicaoUseCase from '@/modules/cronograma/domain/usecase/remove_medicao.usecase';
import {
  CreateMedicaoDto,
  UpdateMedicaoDto,
} from '@/modules/cronograma/dtos/medicao.dto';
import MedicaoResponseDto from '@/modules/cronograma/dtos/medicao_response.dto';

@Controller('api/obras/:obraId/medicoes')
@UseGuards(AccessTokenGuard)
export default class MedicoesController {
  constructor(
    @Inject(CREATE_MEDICAO_SERVICE)
    private readonly createMedicao: ICreateMedicaoUseCase,
    @Inject(LIST_MEDICOES_SERVICE)
    private readonly listMedicoes: IListMedicoesUseCase,
    @Inject(GET_MEDICAO_SERVICE)
    private readonly getMedicao: IGetMedicaoUseCase,
    @Inject(UPDATE_MEDICAO_SERVICE)
    private readonly updateMedicao: IUpdateMedicaoUseCase,
    @Inject(REMOVE_MEDICAO_SERVICE)
    private readonly removeMedicao: IRemoveMedicaoUseCase,
    private readonly tc: TenantRequestContextService,
  ) {}

  @Post()
  async create(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Body() body: CreateMedicaoDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ): Promise<MedicaoResponseDto> {
    return this.tc.run(user, async () =>
      MedicaoResponseDto.fromEntity(
        this.unwrap(
          await this.createMedicao.execute({
            obraId,
            numero: body.numero,
            orgaoId: body.orgaoId,
            tipo: body.tipo,
            dataMedicao: body.dataMedicao,
            observacoes: body.observacoes,
            fontes: body.fontes,
          }),
        ),
      ),
    );
  }

  @Get()
  async list(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Query() query: PaginationOptionsDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () => {
      const page = this.unwrap(
        await this.listMedicoes.execute({
          obraId,
          options: new PageOptionsEntity(query.order, query.page, query.take),
        }),
      );
      return {
        data: page.pageData.map((item) => MedicaoResponseDto.fromEntity(item)),
        meta: page.pageMeta,
      };
    });
  }

  @Get(':id')
  async get(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ): Promise<MedicaoResponseDto> {
    return this.tc.run(user, async () =>
      MedicaoResponseDto.fromEntity(
        this.unwrap(await this.getMedicao.execute({ obraId, id })),
      ),
    );
  }

  @Patch(':id')
  async update(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateMedicaoDto,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ): Promise<MedicaoResponseDto> {
    return this.tc.run(user, async () =>
      MedicaoResponseDto.fromEntity(
        this.unwrap(
          await this.updateMedicao.execute({
            obraId,
            id,
            numero: body.numero,
            orgaoId: body.orgaoId,
            tipo: body.tipo,
            dataMedicao: body.dataMedicao,
            observacoes: body.observacoes,
            fontes: body.fontes,
          }),
        ),
      ),
    );
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @Param('obraId', ParseUUIDPipe) obraId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @AuthenticatedUser() user: AccessTokenPayload | undefined,
  ) {
    return this.tc.run(user, async () =>
      this.unwrap(await this.removeMedicao.execute({ obraId, id })),
    );
  }

  private readonly unwrap = <T>(result: Either<AppException, T>): T => {
    if (result.isLeft()) {
      throw new HttpException(result.value.message, result.value.statusCode, {
        cause: result.value.cause,
      });
    }
    return result.value;
  };
}
