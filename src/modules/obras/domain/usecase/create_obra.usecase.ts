import type UseCase from '@/core/types/use_case';
import ObraEntity from '@/modules/obras/domain/entities/obra.entity';
export interface CreateObraParam { nome:string; tipo:string; orgaoId:string; setorId?:string|null; localidadeId?:string|null; subclassificacaoId?:string|null; eixoId?:string|null; classificacaoId?:string|null; tipologiaId?:string|null; subtipologiaId?:string|null; descricao?:string|null; seguirAutomatico?:boolean; responsavelUsuarioId:string; orcamentos:{fonteId:string;valor:string}[]; criadoPorUsuarioId:string; tenantId:string; }
type ICreateObraUseCase = UseCase<CreateObraParam, ObraEntity>;
export default ICreateObraUseCase;
