import UseCase from '@/core/types/use_case';
import ObraPrivadaObservacaoEntity from '@/modules/obras-privadas/domain/entities/obra_privada_observacao.entity';

export type CreateObraPrivadaObservacaoParam = {
  tenantId: string;
  obraPrivadaId: string;
  texto: string;
  autorUsuarioId: string;
};
type ICreateObraPrivadaObservacaoUseCase = UseCase<
  CreateObraPrivadaObservacaoParam,
  ObraPrivadaObservacaoEntity
>;
export default ICreateObraPrivadaObservacaoUseCase;
