import AppException from '@/core/exceptions/app_exception';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import {
  ClassificacaoEntity,
  EixoEntity,
  SubclassificacaoEntity,
  SubtipologiaEntity,
  TipologiaEntity,
} from '@/modules/obras/domain/entities/cadastro.entity';

export type CadastroTipo =
  | 'eixo'
  | 'classificacao'
  | 'subclassificacao'
  | 'tipologia'
  | 'subtipologia';

export type CadastroEntityUnion =
  | EixoEntity
  | ClassificacaoEntity
  | SubclassificacaoEntity
  | TipologiaEntity
  | SubtipologiaEntity;

export interface ICadastroRepository<TEntity> {
  findPage(
    pageOptions: PageOptionsEntity,
    apenasAtivos?: boolean,
    parentId?: string,
  ): AsyncResult<AppException, PageEntity<TEntity>>;
  findOne(id: string): AsyncResult<AppException, TEntity | null>;
  save(entity: TEntity): AsyncResult<AppException, TEntity>;
}

export type IEixoRepository = ICadastroRepository<EixoEntity>;
export type IClassificacaoRepository =
  ICadastroRepository<ClassificacaoEntity>;
export type ISubclassificacaoRepository =
  ICadastroRepository<SubclassificacaoEntity>;
export type ITipologiaRepository = ICadastroRepository<TipologiaEntity>;
export type ISubtipologiaRepository = ICadastroRepository<SubtipologiaEntity>;
