import TenantRequestContextService from '@/core/multitenancy/tenant_request_context.service';
import type { AccessTokenPayload } from '@/modules/auth/adapters/token_service.interface';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import AuthenticatedUser from '@/modules/auth/controller/authenticated_user.decorator';
import CreateClassificacaoService from '@/modules/obras/application/create_classificacao.service';
import CreateEixoService from '@/modules/obras/application/create_eixo.service';
import CreateSubclassificacaoService from '@/modules/obras/application/create_subclassificacao.service';
import CreateSubtipologiaService from '@/modules/obras/application/create_subtipologia.service';
import CreateTipologiaService from '@/modules/obras/application/create_tipologia.service';
import ListClassificacoesService from '@/modules/obras/application/list_classificacao.service';
import ListEixosService from '@/modules/obras/application/list_eixo.service';
import ListSubclassificacoesService from '@/modules/obras/application/list_subclassificacao.service';
import ListSubtipologiasService from '@/modules/obras/application/list_subtipologia.service';
import ListTipologiasService from '@/modules/obras/application/list_tipologia.service';
import UpdateClassificacaoService from '@/modules/obras/application/update_classificacao.service';
import UpdateEixoService from '@/modules/obras/application/update_eixo.service';
import UpdateSubclassificacaoService from '@/modules/obras/application/update_subclassificacao.service';
import UpdateSubtipologiaService from '@/modules/obras/application/update_subtipologia.service';
import UpdateTipologiaService from '@/modules/obras/application/update_tipologia.service';
import {
  AtualizarCadastroDto,
  CriarCadastroDto,
} from '@/modules/obras/dtos/cadastro.dto';
import ListCadastrosDto from '@/modules/obras/dtos/list_cadastros.dto';
import {
  CREATE_CLASSIFICACAO_SERVICE,
  CREATE_EIXO_SERVICE,
  CREATE_SUBCLASSIFICACAO_SERVICE,
  CREATE_SUBTIPOLOGIA_SERVICE,
  CREATE_TIPOLOGIA_SERVICE,
  LIST_CLASSIFICACOES_SERVICE,
  LIST_EIXOS_SERVICE,
  LIST_SUBCLASSIFICACOES_SERVICE,
  LIST_SUBTIPOLOGIAS_SERVICE,
  LIST_TIPOLOGIAS_SERVICE,
  UPDATE_CLASSIFICACAO_SERVICE,
  UPDATE_EIXO_SERVICE,
  UPDATE_SUBCLASSIFICACAO_SERVICE,
  UPDATE_SUBTIPOLOGIA_SERVICE,
  UPDATE_TIPOLOGIA_SERVICE,
} from '@/modules/obras/symbols';
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

@Controller('api/cadastros')
@UseGuards(AccessTokenGuard)
export default class CadastrosController {
  constructor(
    @Inject(LIST_EIXOS_SERVICE)
    private readonly listEixosService: ListEixosService,
    @Inject(CREATE_EIXO_SERVICE)
    private readonly createEixoService: CreateEixoService,
    @Inject(UPDATE_EIXO_SERVICE)
    private readonly updateEixoService: UpdateEixoService,
    @Inject(LIST_CLASSIFICACOES_SERVICE)
    private readonly listClassificacoesService: ListClassificacoesService,
    @Inject(CREATE_CLASSIFICACAO_SERVICE)
    private readonly createClassificacaoService: CreateClassificacaoService,
    @Inject(UPDATE_CLASSIFICACAO_SERVICE)
    private readonly updateClassificacaoService: UpdateClassificacaoService,
    @Inject(LIST_SUBCLASSIFICACOES_SERVICE)
    private readonly listSubclassificacoesService: ListSubclassificacoesService,
    @Inject(CREATE_SUBCLASSIFICACAO_SERVICE)
    private readonly createSubclassificacaoService: CreateSubclassificacaoService,
    @Inject(UPDATE_SUBCLASSIFICACAO_SERVICE)
    private readonly updateSubclassificacaoService: UpdateSubclassificacaoService,
    @Inject(LIST_TIPOLOGIAS_SERVICE)
    private readonly listTipologiasService: ListTipologiasService,
    @Inject(CREATE_TIPOLOGIA_SERVICE)
    private readonly createTipologiaService: CreateTipologiaService,
    @Inject(UPDATE_TIPOLOGIA_SERVICE)
    private readonly updateTipologiaService: UpdateTipologiaService,
    @Inject(LIST_SUBTIPOLOGIAS_SERVICE)
    private readonly listSubtipologiasService: ListSubtipologiasService,
    @Inject(CREATE_SUBTIPOLOGIA_SERVICE)
    private readonly createSubtipologiaService: CreateSubtipologiaService,
    @Inject(UPDATE_SUBTIPOLOGIA_SERVICE)
    private readonly updateSubtipologiaService: UpdateSubtipologiaService,
    private readonly tc: TenantRequestContextService,
  ) {}

  private async run<U>(
    user: AccessTokenPayload | undefined,
    fn: () => Promise<U>,
  ): Promise<U> {
    return this.tc.run(user, fn);
  }

  @Get('eixos')
  async listEixos(
    @Query() query: ListCadastrosDto,
    @AuthenticatedUser() u?: AccessTokenPayload,
  ) {
    return this.run(u, async () => {
      const r = await this.listEixosService.execute({
        page: query.page,
        take: query.take,
        apenasAtivos: query.apenasAtivos,
      });
      if (r.isLeft())
        throw new HttpException(r.value.message, r.value.statusCode, {
          cause: r.value.cause,
        });
      return r.value.toObject();
    });
  }

  @Post('eixos')
  async createEixo(
    @Body() b: CriarCadastroDto,
    @AuthenticatedUser() u?: AccessTokenPayload,
  ) {
    return this.run(u, async () => {
      const r = await this.createEixoService.execute({ nome: b.nome });
      if (r.isLeft())
        throw new HttpException(r.value.message, r.value.statusCode, {
          cause: r.value.cause,
        });
      return r.value.toObject();
    });
  }

  @Patch('eixos/:id')
  async updateEixo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() b: AtualizarCadastroDto,
    @AuthenticatedUser() u?: AccessTokenPayload,
  ) {
    return this.run(u, async () => {
      const r = await this.updateEixoService.execute({
        id,
        nome: b.nome,
        ativo: b.ativo,
      });
      if (r.isLeft())
        throw new HttpException(r.value.message, r.value.statusCode, {
          cause: r.value.cause,
        });
      return (r.value as { toObject(): unknown }).toObject();
    });
  }

  @Get('classificacoes')
  async listClassificacoes(
    @Query() query: ListCadastrosDto,
    @AuthenticatedUser() u?: AccessTokenPayload,
  ) {
    return this.run(u, async () => {
      const r = await this.listClassificacoesService.execute({
        page: query.page,
        take: query.take,
        apenasAtivos: query.apenasAtivos,
      });
      if (r.isLeft())
        throw new HttpException(r.value.message, r.value.statusCode, {
          cause: r.value.cause,
        });
      return {
        data: r.value.pageData.map((e) =>
          (e as { toObject(): unknown }).toObject(),
        ),
        meta: r.value.pageMeta,
      };
    });
  }

  @Post('classificacoes')
  async createClassificacao(
    @Body() b: CriarCadastroDto,
    @AuthenticatedUser() u?: AccessTokenPayload,
  ) {
    return this.run(u, async () => {
      const r = await this.createClassificacaoService.execute({ nome: b.nome });
      if (r.isLeft())
        throw new HttpException(r.value.message, r.value.statusCode, {
          cause: r.value.cause,
        });
      return (r.value as { toObject(): unknown }).toObject();
    });
  }

  @Patch('classificacoes/:id')
  async updateClassificacao(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() b: AtualizarCadastroDto,
    @AuthenticatedUser() u?: AccessTokenPayload,
  ) {
    return this.run(u, async () => {
      const r = await this.updateClassificacaoService.execute({
        id,
        nome: b.nome,
        ativo: b.ativo,
      });
      if (r.isLeft())
        throw new HttpException(r.value.message, r.value.statusCode, {
          cause: r.value.cause,
        });
      return (r.value as { toObject(): unknown }).toObject();
    });
  }

  @Get('classificacoes/:classificacaoId/subclassificacoes')
  async listSubclassificacoes(
    @Param('classificacaoId', ParseUUIDPipe) parentId: string,
    @Query() query: ListCadastrosDto,
    @AuthenticatedUser() u?: AccessTokenPayload,
  ) {
    return this.run(u, async () => {
      const r = await this.listSubclassificacoesService.execute({
        page: query.page,
        take: query.take,
        apenasAtivos: query.apenasAtivos,
        parentId,
      });
      if (r.isLeft())
        throw new HttpException(r.value.message, r.value.statusCode, {
          cause: r.value.cause,
        });
      return r.value.toObject();
    });
  }

  @Post('classificacoes/:classificacaoId/subclassificacoes')
  async createSubclassificacao(
    @Param('classificacaoId', ParseUUIDPipe) parentId: string,
    @Body() b: CriarCadastroDto,
    @AuthenticatedUser() u?: AccessTokenPayload,
  ) {
    return this.run(u, async () => {
      const r = await this.createSubclassificacaoService.execute({
        nome: b.nome,
        parentId,
      });
      if (r.isLeft())
        throw new HttpException(r.value.message, r.value.statusCode, {
          cause: r.value.cause,
        });
      return r.value.toObject();
    });
  }

  @Patch('subclassificacoes/:id')
  async updateSubclassificacao(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() b: AtualizarCadastroDto,
    @AuthenticatedUser() u?: AccessTokenPayload,
  ) {
    return this.run(u, async () => {
      const r = await this.updateSubclassificacaoService.execute({
        id,
        nome: b.nome,
        ativo: b.ativo,
      });
      if (r.isLeft())
        throw new HttpException(r.value.message, r.value.statusCode, {
          cause: r.value.cause,
        });
      return r.value.toObject();
    });
  }

  @Get('tipologias')
  async listTipologias(
    @Query() query: ListCadastrosDto,
    @AuthenticatedUser() u?: AccessTokenPayload,
  ) {
    return this.run(u, async () => {
      const r = await this.listTipologiasService.execute({
        page: query.page,
        take: query.take,
        apenasAtivos: query.apenasAtivos,
      });
      if (r.isLeft())
        throw new HttpException(r.value.message, r.value.statusCode, {
          cause: r.value.cause,
        });
      return r.value.toObject();
    });
  }

  @Post('tipologias')
  async createTipologia(
    @Body() b: CriarCadastroDto,
    @AuthenticatedUser() u?: AccessTokenPayload,
  ) {
    return this.run(u, async () => {
      const r = await this.createTipologiaService.execute({ nome: b.nome });
      if (r.isLeft())
        throw new HttpException(r.value.message, r.value.statusCode, {
          cause: r.value.cause,
        });
      return r.value.toObject();
    });
  }

  @Patch('tipologias/:id')
  async updateTipologia(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() b: AtualizarCadastroDto,
    @AuthenticatedUser() u?: AccessTokenPayload,
  ) {
    return this.run(u, async () => {
      const r = await this.updateTipologiaService.execute({
        id,
        nome: b.nome,
        ativo: b.ativo,
      });
      if (r.isLeft())
        throw new HttpException(r.value.message, r.value.statusCode, {
          cause: r.value.cause,
        });
      return r.value.toObject();
    });
  }

  @Get('tipologias/:tipologiaId/subtipologias')
  async listSubtipologias(
    @Param('tipologiaId', ParseUUIDPipe) parentId: string,
    @Query() query: ListCadastrosDto,
    @AuthenticatedUser() u?: AccessTokenPayload,
  ) {
    return this.run(u, async () => {
      const r = await this.listSubtipologiasService.execute({
        page: query.page,
        take: query.take,
        apenasAtivos: query.apenasAtivos,
        parentId,
      });
      if (r.isLeft())
        throw new HttpException(r.value.message, r.value.statusCode, {
          cause: r.value.cause,
        });
      return r.value.toObject();
    });
  }

  @Post('tipologias/:tipologiaId/subtipologias')
  async createSubtipologia(
    @Param('tipologiaId', ParseUUIDPipe) parentId: string,
    @Body() b: CriarCadastroDto,
    @AuthenticatedUser() u?: AccessTokenPayload,
  ) {
    return this.run(u, async () => {
      const r = await this.createSubtipologiaService.execute({
        nome: b.nome,
        parentId,
      });
      if (r.isLeft())
        throw new HttpException(r.value.message, r.value.statusCode, {
          cause: r.value.cause,
        });
      return r.value.toObject();
    });
  }

  @Patch('subtipologias/:id')
  async updateSubtipologia(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() b: AtualizarCadastroDto,
    @AuthenticatedUser() u?: AccessTokenPayload,
  ) {
    return this.run(u, async () => {
      const r = await this.updateSubtipologiaService.execute({
        id,
        nome: b.nome,
        ativo: b.ativo,
      });
      if (r.isLeft())
        throw new HttpException(r.value.message, r.value.statusCode, {
          cause: r.value.cause,
        });
      return (r.value as { toObject(): unknown }).toObject();
    });
  }
}
