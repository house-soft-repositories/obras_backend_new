import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { ITipologiaRepository } from '@/modules/obras/adapters/cadastros_repository.interface';
import { TipologiaEntity } from '@/modules/obras/domain/entities/cadastro.entity';
import { left } from '@/core/types/either';
import CadastroRepositoryException from '@/modules/obras/exceptions/cadastro_repository.exception';
import ErrorCodeConstants from '@/core/constants/error_code.constants';

export default class UpdateTipologiaService {
  constructor(private readonly repository: ITipologiaRepository) {}
  async execute(param: { id: string; nome?: string; ativo?: boolean }): AsyncResult<AppException, TipologiaEntity> {
    const found = await this.repository.findOne(param.id);
    if (found.isLeft()) return left(found.value);
    if (!found.value) return left(new CadastroRepositoryException({ code: ErrorCodeConstants.CADASTRO_NOT_FOUND, statusCode: 404 }));
    found.value.update({ nome: param.nome, ativo: param.ativo });
    return this.repository.save(found.value);
  }
}
