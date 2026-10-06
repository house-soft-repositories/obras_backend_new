import AppException from '@/core/exceptions/app_exception';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import AsyncResult from '@/core/types/async_result';
import MedicaoEntity from '@/modules/cronograma/domain/entities/medicao.entity';
import { TipoMedicao } from '@/modules/cronograma/domain/enums/cronograma.enums';

export type MedicaoFonteParam = { fonteId: string; valor: number };

export type CreateMedicaoParam = {
  obraId: string;
  numero: number;
  tipo: TipoMedicao;
  dataMedicao: string;
  orgaoId: string;
  observacoes?: string;
  fontes: MedicaoFonteParam[];
};

export type UpdateMedicaoParam = {
  obraId: string;
  id: string;
  numero?: number;
  tipo?: TipoMedicao;
  dataMedicao?: string;
  orgaoId?: string;
  observacoes?: string;
  fontes?: MedicaoFonteParam[];
};

export type IMedicoesUseCase = {
  create(p: CreateMedicaoParam): AsyncResult<AppException, MedicaoEntity>;
  list(
    obraId: string,
    options: PageOptionsEntity,
  ): AsyncResult<AppException, PageEntity<MedicaoEntity>>;
  get(obraId: string, id: string): AsyncResult<AppException, MedicaoEntity>;
  update(p: UpdateMedicaoParam): AsyncResult<AppException, MedicaoEntity>;
  remove(obraId: string, id: string): AsyncResult<AppException, void>;
};

export default IMedicoesUseCase;
