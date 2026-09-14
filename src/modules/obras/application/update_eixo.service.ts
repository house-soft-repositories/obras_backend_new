import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { IEixoRepository } from '@/modules/obras/adapters/cadastros_repository.interface';
import { EixoEntity } from '@/modules/obras/domain/entities/cadastro.entity';
import { left } from '@/core/types/either';
import CadastroRepositoryException from '@/modules/obras/exceptions/cadastro_repository.exception';
import ErrorCodeConstants from '@/core/constants/error_code.constants';

export default class UpdateEixoService {
  constructor(private readonly repository: IEixoRepository) {}
  async execute(param: { id: string; nome?: string; ativo?: boolean }): AsyncResult<AppException, EixoEntity> {
    const found = await this.repository.findOne(param.id);
    if (found.isLeft()) return left(found.value);
    if (!found.value) return left(new CadastroRepositoryException({ code: ErrorCodeConstants.CADASTRO_NOT_FOUND, statusCode: 404 }));
    found.value.update({ nome: param.nome, ativo: param.ativo });
    return this.repository.save(found.value);
  }
}
