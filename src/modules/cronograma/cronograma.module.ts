import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import CoreModule from '@/core/core.module';
import AuthModule from '@/modules/auth/auth.module';
import TenantContext from '@/core/multitenancy/tenant_context';
import AccessTokenGuard from '@/modules/auth/controller/access_token.guard';
import EstagiosController from '@/modules/cronograma/controller/estagios.controller';
import MedicoesController from '@/modules/cronograma/controller/medicoes.controller';
import CreateEstagioService from '@/modules/cronograma/application/create_estagio.service';
import CreateEstagiosLoteService from '@/modules/cronograma/application/create_estagios_lote.service';
import ListEstagiosService from '@/modules/cronograma/application/list_estagios.service';
import GetEstagioService from '@/modules/cronograma/application/get_estagio.service';
import UpdateEstagioService from '@/modules/cronograma/application/update_estagio.service';
import RemoveEstagioService from '@/modules/cronograma/application/remove_estagio.service';
import ReorderEstagiosService from '@/modules/cronograma/application/reorder_estagios.service';
import UpdatePercentualDiretoService from '@/modules/cronograma/application/update_percentual_direto.service';
import GetDatasAgregadasService from '@/modules/cronograma/application/get_datas_agregadas.service';
import GetEstagioAtualService from '@/modules/cronograma/application/get_estagio_atual.service';
import AssumirEstagioService from '@/modules/cronograma/application/assumir_estagio.service';
import ConcluirEstagioService from '@/modules/cronograma/application/concluir_estagio.service';
import DuplicarEstagioService from '@/modules/cronograma/application/duplicar_estagio.service';
import AcompanhamentosService from '@/modules/cronograma/application/acompanhamentos.service';
import ComentariosService from '@/modules/cronograma/application/comentarios.service';
import PredefinidosService from '@/modules/cronograma/application/predefinidos.service';
import CreateMedicaoService from '@/modules/cronograma/application/create_medicao.service';
import ListMedicoesService from '@/modules/cronograma/application/list_medicoes.service';
import GetMedicaoService from '@/modules/cronograma/application/get_medicao.service';
import UpdateMedicaoService from '@/modules/cronograma/application/update_medicao.service';
import RemoveMedicaoService from '@/modules/cronograma/application/remove_medicao.service';
import EstagioRepository from '@/modules/cronograma/infra/repositories/estagio.repository';
import AcompanhamentoRepository from '@/modules/cronograma/infra/repositories/acompanhamento.repository';
import ComentarioRepository from '@/modules/cronograma/infra/repositories/comentario.repository';
import MedicaoRepository from '@/modules/cronograma/infra/repositories/medicao.repository';
import IEstagioRepository from '@/modules/cronograma/adapters/estagio_repository.interface';
import IAcompanhamentoRepository from '@/modules/cronograma/adapters/acompanhamento_repository.interface';
import IComentarioRepository from '@/modules/cronograma/adapters/comentario_repository.interface';
import IMedicaoRepository from '@/modules/cronograma/adapters/medicao_repository.interface';
import {
  ESTAGIO_REPOSITORY,
  ACOMPANHAMENTO_REPOSITORY,
  COMENTARIO_REPOSITORY,
  MEDICAO_REPOSITORY,
  CREATE_ESTAGIO_SERVICE,
  CREATE_ESTAGIOS_LOTE_SERVICE,
  LIST_ESTAGIOS_SERVICE,
  GET_ESTAGIO_SERVICE,
  UPDATE_ESTAGIO_SERVICE,
  REMOVE_ESTAGIO_SERVICE,
  REORDER_ESTAGIOS_SERVICE,
  UPDATE_PERCENTUAL_DIRETO_SERVICE,
  GET_DATAS_AGREGADAS_SERVICE,
  GET_ESTAGIO_ATUAL_SERVICE,
  ASSUMIR_ESTAGIO_SERVICE,
  CONCLUIR_ESTAGIO_SERVICE,
  DUPLICAR_ESTAGIO_SERVICE,
  ACOMPANHAMENTOS_SERVICE,
  COMENTARIOS_SERVICE,
  PREDEFINIDOS_SERVICE,
  CREATE_MEDICAO_SERVICE,
  LIST_MEDICOES_SERVICE,
  GET_MEDICAO_SERVICE,
  UPDATE_MEDICAO_SERVICE,
  REMOVE_MEDICAO_SERVICE,
} from '@/modules/cronograma/symbols';
import IObraRepository from '@/modules/obras/adapters/obra_repository.interface';
import ObraRepository from '@/modules/obras/infra/repositories/obra.repository';
import { OBRA_REPOSITORY } from '@/modules/obras/symbols';
import IFonteRepository from '@/modules/fontes/adapters/fonte_repository.interface';
import FonteRepository from '@/modules/fontes/infra/repositories/fonte.repository';
import { FONTE_REPOSITORY } from '@/modules/fontes/symbols';
import EstagioModel from '@/modules/cronograma/infra/models/estagio.model';
import EstagioAcompanhamentoModel from '@/modules/cronograma/infra/models/estagio_acompanhamento.model';
import EstagioComentarioModel from '@/modules/cronograma/infra/models/estagio_comentario.model';
import MedicaoModel from '@/modules/cronograma/infra/models/medicao.model';
import MedicaoFonteModel from '@/modules/cronograma/infra/models/medicao_fonte.model';

@Module({
  imports: [
    CoreModule,
    AuthModule,
    TypeOrmModule.forFeature([
      EstagioModel,
      EstagioAcompanhamentoModel,
      EstagioComentarioModel,
      MedicaoModel,
      MedicaoFonteModel,
    ]),
  ],
  controllers: [EstagiosController, MedicoesController],
  providers: [
    AccessTokenGuard,
    {
      provide: OBRA_REPOSITORY,
      inject: [DataSource, TenantContext],
      useFactory: (ds: DataSource, tc: TenantContext) =>
        new ObraRepository(ds, tc),
    },
    {
      provide: ESTAGIO_REPOSITORY,
      inject: [DataSource, TenantContext],
      useFactory: (ds: DataSource, tc: TenantContext) =>
        new EstagioRepository(ds, tc) as IEstagioRepository,
    },
    {
      provide: ACOMPANHAMENTO_REPOSITORY,
      inject: [DataSource, TenantContext],
      useFactory: (ds: DataSource, tc: TenantContext) =>
        new AcompanhamentoRepository(ds, tc) as IAcompanhamentoRepository,
    },
    {
      provide: COMENTARIO_REPOSITORY,
      inject: [DataSource, TenantContext],
      useFactory: (ds: DataSource, tc: TenantContext) =>
        new ComentarioRepository(ds, tc) as IComentarioRepository,
    },
    {
      provide: MEDICAO_REPOSITORY,
      inject: [DataSource, TenantContext],
      useFactory: (ds: DataSource, tc: TenantContext) =>
        new MedicaoRepository(ds, tc) as IMedicaoRepository,
    },
    {
      provide: CREATE_ESTAGIO_SERVICE,
      inject: [ESTAGIO_REPOSITORY, TenantContext, OBRA_REPOSITORY],
      useFactory: (
        r: IEstagioRepository,
        tc: TenantContext,
        o: IObraRepository,
      ) => new CreateEstagioService(r, tc, o),
    },
    {
      provide: CREATE_ESTAGIOS_LOTE_SERVICE,
      inject: [ESTAGIO_REPOSITORY, TenantContext, OBRA_REPOSITORY],
      useFactory: (
        r: IEstagioRepository,
        tc: TenantContext,
        o: IObraRepository,
      ) => new CreateEstagiosLoteService(r, tc, o),
    },
    {
      provide: LIST_ESTAGIOS_SERVICE,
      inject: [ESTAGIO_REPOSITORY, OBRA_REPOSITORY],
      useFactory: (r: IEstagioRepository, o: IObraRepository) =>
        new ListEstagiosService(r, o),
    },
    {
      provide: GET_ESTAGIO_SERVICE,
      inject: [ESTAGIO_REPOSITORY, OBRA_REPOSITORY],
      useFactory: (r: IEstagioRepository, o: IObraRepository) =>
        new GetEstagioService(r, o),
    },
    {
      provide: UPDATE_ESTAGIO_SERVICE,
      inject: [ESTAGIO_REPOSITORY, OBRA_REPOSITORY],
      useFactory: (r: IEstagioRepository, o: IObraRepository) =>
        new UpdateEstagioService(r, o),
    },
    {
      provide: REMOVE_ESTAGIO_SERVICE,
      inject: [ESTAGIO_REPOSITORY, OBRA_REPOSITORY],
      useFactory: (r: IEstagioRepository, o: IObraRepository) =>
        new RemoveEstagioService(r, o),
    },
    {
      provide: REORDER_ESTAGIOS_SERVICE,
      inject: [ESTAGIO_REPOSITORY, OBRA_REPOSITORY],
      useFactory: (r: IEstagioRepository, o: IObraRepository) =>
        new ReorderEstagiosService(r, o),
    },
    {
      provide: UPDATE_PERCENTUAL_DIRETO_SERVICE,
      inject: [ESTAGIO_REPOSITORY, OBRA_REPOSITORY],
      useFactory: (r: IEstagioRepository, o: IObraRepository) =>
        new UpdatePercentualDiretoService(r, o),
    },
    {
      provide: GET_DATAS_AGREGADAS_SERVICE,
      inject: [ESTAGIO_REPOSITORY, OBRA_REPOSITORY],
      useFactory: (r: IEstagioRepository, o: IObraRepository) =>
        new GetDatasAgregadasService(r, o),
    },
    {
      provide: GET_ESTAGIO_ATUAL_SERVICE,
      inject: [ESTAGIO_REPOSITORY, OBRA_REPOSITORY],
      useFactory: (r: IEstagioRepository, o: IObraRepository) =>
        new GetEstagioAtualService(r, o),
    },
    {
      provide: ASSUMIR_ESTAGIO_SERVICE,
      inject: [ESTAGIO_REPOSITORY, OBRA_REPOSITORY],
      useFactory: (r: IEstagioRepository, o: IObraRepository) =>
        new AssumirEstagioService(r, o),
    },
    {
      provide: CONCLUIR_ESTAGIO_SERVICE,
      inject: [ESTAGIO_REPOSITORY, OBRA_REPOSITORY],
      useFactory: (r: IEstagioRepository, o: IObraRepository) =>
        new ConcluirEstagioService(r, o),
    },
    {
      provide: DUPLICAR_ESTAGIO_SERVICE,
      inject: [ESTAGIO_REPOSITORY, OBRA_REPOSITORY],
      useFactory: (r: IEstagioRepository, o: IObraRepository) =>
        new DuplicarEstagioService(r, o),
    },
    {
      provide: ACOMPANHAMENTOS_SERVICE,
      inject: [
        ACOMPANHAMENTO_REPOSITORY,
        TenantContext,
        OBRA_REPOSITORY,
        ESTAGIO_REPOSITORY,
      ],
      useFactory: (
        r: IAcompanhamentoRepository,
        tc: TenantContext,
        o: IObraRepository,
        er: IEstagioRepository,
      ) => new AcompanhamentosService(r, tc, o, er),
    },
    {
      provide: COMENTARIOS_SERVICE,
      inject: [
        COMENTARIO_REPOSITORY,
        TenantContext,
        OBRA_REPOSITORY,
        ESTAGIO_REPOSITORY,
      ],
      useFactory: (
        r: IComentarioRepository,
        tc: TenantContext,
        o: IObraRepository,
        er: IEstagioRepository,
      ) => new ComentariosService(r, tc, o, er),
    },
    {
      provide: PREDEFINIDOS_SERVICE,
      inject: [ESTAGIO_REPOSITORY, TenantContext, OBRA_REPOSITORY],
      useFactory: (
        r: IEstagioRepository,
        tc: TenantContext,
        o: IObraRepository,
      ) => new PredefinidosService(r, tc, o),
    },
    {
      provide: CREATE_MEDICAO_SERVICE,
      inject: [
        MEDICAO_REPOSITORY,
        TenantContext,
        OBRA_REPOSITORY,
        FONTE_REPOSITORY,
        DataSource,
      ],
      useFactory: (
        r: IMedicaoRepository,
        tc: TenantContext,
        o: IObraRepository,
        f: IFonteRepository,
        ds: DataSource,
      ) => new CreateMedicaoService(r, tc, o, f, ds),
    },
    {
      provide: LIST_MEDICOES_SERVICE,
      inject: [MEDICAO_REPOSITORY, OBRA_REPOSITORY],
      useFactory: (r: IMedicaoRepository, o: IObraRepository) =>
        new ListMedicoesService(r, o),
    },
    {
      provide: GET_MEDICAO_SERVICE,
      inject: [MEDICAO_REPOSITORY, OBRA_REPOSITORY],
      useFactory: (r: IMedicaoRepository, o: IObraRepository) =>
        new GetMedicaoService(r, o),
    },
    {
      provide: UPDATE_MEDICAO_SERVICE,
      inject: [
        MEDICAO_REPOSITORY,
        TenantContext,
        OBRA_REPOSITORY,
        FONTE_REPOSITORY,
        DataSource,
      ],
      useFactory: (
        r: IMedicaoRepository,
        tc: TenantContext,
        o: IObraRepository,
        f: IFonteRepository,
        ds: DataSource,
      ) => new UpdateMedicaoService(r, tc, o, f, ds),
    },
    {
      provide: REMOVE_MEDICAO_SERVICE,
      inject: [MEDICAO_REPOSITORY, OBRA_REPOSITORY],
      useFactory: (r: IMedicaoRepository, o: IObraRepository) =>
        new RemoveMedicaoService(r, o),
    },
    {
      provide: FONTE_REPOSITORY,
      inject: [DataSource, TenantContext],
      useFactory: (ds: DataSource, tc: TenantContext) =>
        new FonteRepository(ds, tc) as IFonteRepository,
    },
  ],
  exports: [
    CREATE_ESTAGIO_SERVICE,
    CREATE_ESTAGIOS_LOTE_SERVICE,
    LIST_ESTAGIOS_SERVICE,
    GET_ESTAGIO_SERVICE,
    UPDATE_ESTAGIO_SERVICE,
    REMOVE_ESTAGIO_SERVICE,
    REORDER_ESTAGIOS_SERVICE,
    UPDATE_PERCENTUAL_DIRETO_SERVICE,
    GET_DATAS_AGREGADAS_SERVICE,
    GET_ESTAGIO_ATUAL_SERVICE,
    ASSUMIR_ESTAGIO_SERVICE,
    CONCLUIR_ESTAGIO_SERVICE,
    DUPLICAR_ESTAGIO_SERVICE,
    ACOMPANHAMENTOS_SERVICE,
    COMENTARIOS_SERVICE,
    PREDEFINIDOS_SERVICE,
    CREATE_MEDICAO_SERVICE,
    LIST_MEDICOES_SERVICE,
    GET_MEDICAO_SERVICE,
    UPDATE_MEDICAO_SERVICE,
    REMOVE_MEDICAO_SERVICE,
  ],
})
export default class CronogramaModule {}
