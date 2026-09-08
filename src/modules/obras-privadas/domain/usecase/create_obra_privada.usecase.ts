import type UseCase from '@/core/types/use_case';
import ObraPrivadaEntity from '@/modules/obras-privadas/domain/entities/obra_privada.entity';
export interface CreateObraPrivadaParam { descricao:string; observacoes?:string|null; proprietarioPessoaId:string; logradouro:string; uf:string; orgaoId?:string|null; inscricaoImobiliaria?:string|null; matriculaRgi?:string|null; cartorio?:string|null; cep?:string|null; numero?:string|null; complemento?:string|null; bairro?:string|null; localidadeId?:string|null; latitude?:string|null; longitude?:string|null; geoOrigem?:string|null; andamento?:string|null; habiteSe?:string|null; dataInicio?:string|null; dataPrevistaConclusao?:string|null; tenantId:string; }
type ICreateObraPrivadaUseCase = UseCase<CreateObraPrivadaParam, ObraPrivadaEntity>;
export default ICreateObraPrivadaUseCase;
