import { DataSource } from 'typeorm';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import MeReadModel from '@/modules/auth/domain/read_models/me.read_model';
import IGetMeUseCase from '@/modules/auth/domain/usecase/get_me.usecase';
import TenancyModel from '@/modules/tenancy/infra/models/tenancy.model';
import IUserRepository from '@/modules/users/adapters/user_repository.interface';

export default class GetMeService implements IGetMeUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly dataSource: DataSource,
  ) {}

  async execute(userId: string): AsyncResult<AppException, MeReadModel> {
    try {
      const userResult = await this.userRepository.findById(userId);
      if (userResult.isLeft()) return left(userResult.value);

      const user = userResult.value;
      let tenant: MeReadModel['tenant'] = null;

      if (user.tenantId) {
        const tenancy = await this.dataSource.getRepository(TenancyModel).findOne({
          where: { id: user.tenantId },
          select: { id: true, name: true },
        });
        if (tenancy) {
          tenant = { id: tenancy.id, name: tenancy.name };
        }
      }

      return right({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenant,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } catch (error) {
      if (error instanceof AppException) return left(error);
      return left(
        new AppException({
          code: ErrorCodeConstants.UNEXPECTED_ERROR,
          statusCode: 500,
          cause: error,
        }),
      );
    }
  }
}
