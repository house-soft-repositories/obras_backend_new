import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left } from '@/core/types/either';
import IAlvaraRepository from '@/modules/obras-privadas/adapters/alvara_repository.interface';
import IObraPrivadaRepository from '@/modules/obras-privadas/adapters/obra_privada_repository.interface';
import AlvaraEntity from '@/modules/obras-privadas/domain/entities/alvara.entity';
import ICreateAlvaraUseCase, {
  CreateAlvaraParam,
} from '@/modules/obras-privadas/domain/usecase/create_alvara.usecase';
import ObraPrivadaServiceException from '@/modules/obras-privadas/exceptions/obra_privada_service.exception';

export default class CreateAlvaraService implements ICreateAlvaraUseCase {
  constructor(
    private readonly alvaraRepository: IAlvaraRepository,
    private readonly obraPrivadaRepository: IObraPrivadaRepository,
  ) {}

  async execute(
    param: CreateAlvaraParam,
  ): AsyncResult<AppException, AlvaraEntity> {
    try {
      const obra = await this.obraPrivadaRepository.findById(
        param.obraPrivadaId,
      );
      if (obra.isLeft()) return left(obra.value);
      if (!obra.value) {
        return left(
          new ObraPrivadaServiceException({
            code: ErrorCodeConstants.OBRA_PRIVADA_NOT_FOUND,
            statusCode: 404,
          }),
        );
      }
      const entity = AlvaraEntity.create({
        ...param,
        numero: param.numero ?? null,
        dataEmissao: param.dataEmissao ?? null,
        dataValidade: param.dataValidade ?? null,
        alvaraAnteriorId: param.alvaraAnteriorId ?? null,
        areaTerrenoM2: param.areaTerrenoM2 ?? null,
        areaConstruidaAprovadaM2: param.areaConstruidaAprovadaM2 ?? null,
        uso: param.uso ?? null,
        pavimentos: param.pavimentos ?? null,
        unidades: param.unidades ?? null,
        processoAdministrativo: param.processoAdministrativo ?? null,
        arquivoId: param.arquivoId ?? null,
        observacoes: param.observacoes ?? null,
      });
      return this.alvaraRepository.save(entity);
    } catch (error) {
      if (error instanceof AppException) return left(error);
      return left(
        new ObraPrivadaServiceException({
          code: ErrorCodeConstants.ALVARA_INVALID_INPUT,
          statusCode: 400,
          cause: error,
        }),
      );
    }
  }
}
