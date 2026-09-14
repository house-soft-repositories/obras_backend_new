import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { ISubtipologiaRepository } from '@/modules/obras/adapters/cadastros_repository.interface';
import { SubtipologiaEntity } from '@/modules/obras/domain/entities/cadastro.entity';
import { left } from '@/core/types/either';
import CadastroRepositoryException from '@/modules/obras/exceptions/cadastro_repository.exception';
import ErrorCodeConstants from '@/core/constants/error_code.constants';

export default class UpdateSubtipologiaService {
  constructor(private readonly repository: ISubtipologiaRepository) {}
  async execute(param: { id: string; nome?: string; ativo?: boolean }): AsyncResult<AppException, SubtipologiaEntity> {
    const found = await this.repository.findOne(param.id);
    if (found.isLeft()) return left(found.value);
    if (!found.value) return left(new CadastroRepositoryException({ code: ErrorCodeConstants.CADASTRO_NOT_FOUND, statusCode: 404 }));
    found.value.update({ nome: param.nome, ativo: param.ativo });
    return this.repository.save(found.value);
  }
}
