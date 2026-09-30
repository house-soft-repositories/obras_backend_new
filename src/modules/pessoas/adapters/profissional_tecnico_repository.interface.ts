import AppException from '@/core/exceptions/app_exception';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import ProfissionalTecnicoEntity, {
  ProfissionalTecnicoComPessoaProps,
} from '@/modules/pessoas/domain/entities/profissional_tecnico.entity';

export default interface IProfissionalTecnicoRepository {
  save(
    entity: ProfissionalTecnicoEntity,
  ): AsyncResult<AppException, ProfissionalTecnicoEntity>;
  findById(id: string): AsyncResult<AppException, ProfissionalTecnicoEntity | null>;
  findByPessoaId(
    pessoaId: string,
  ): AsyncResult<AppException, ProfissionalTecnicoEntity | null>;
  findViewById(
    id: string,
  ): AsyncResult<AppException, ProfissionalTecnicoComPessoaProps | null>;
  findAllViews(): AsyncResult<AppException, ProfissionalTecnicoComPessoaProps[]>;
  searchViews(
    pageOptions: PageOptionsEntity,
    query: string,
  ): AsyncResult<AppException, PageEntity<ProfissionalTecnicoComPessoaProps>>;
}
