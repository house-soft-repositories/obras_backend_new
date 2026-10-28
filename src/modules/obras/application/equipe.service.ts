import { DataSource, IsNull } from 'typeorm';
import { withManager } from '@/core/multitenancy/tenant_manager';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';
import { ObraResponsavelTipo } from '@/modules/obras/domain/enums/obra_responsavel_tipo.enum';
import IUserRepository from '@/modules/users/adapters/user_repository.interface';
import ObraModel from '@/modules/obras/infra/models/obra.model';
import {
  ObraResponsavelModel,
  ObraSeguidorModel,
} from '@/modules/obras/infra/models/obra_items.model';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import { unit, type Unit } from '@/core/types/unit';
import ObraRepositoryException from '@/modules/obras/exceptions/obra_repository.exception';
import { randomUUID } from 'node:crypto';

export default class EquipeService {
  constructor(
    private readonly ds: DataSource,
    private readonly tc: TenantContext,
    private readonly users: IUserRepository,
  ) {}

  async addResponsavel(param: {
    obraId: string;
    usuarioId: string;
    tipo?: ObraResponsavelTipo;
  }): AsyncResult<AppException, Unit> {
    try {
      const ctx = this.tc.require();
      if (
        param.tipo !== undefined &&
        param.tipo !== ObraResponsavelTipo.RESPONSAVEL
      )
        return left(
          new ObraRepositoryException({
            code: ErrorCodeConstants.OBRA_INVALID_RESPONSAVEL,
            statusCode: 422,
          }),
        );
      const userResult = await this.users.findOne({
        id: param.usuarioId,
        tenantId: ctx.tenantId,
      });
      if (userResult.isLeft()) return left(userResult.value);
      if (userResult.value.role !== UserRole.STAFF)
        return left(
          new ObraRepositoryException({
            code: ErrorCodeConstants.OBRA_INVALID_RESPONSAVEL,
            statusCode: 422,
          }),
        );
      const obra = await withManager(this.ds, this.tc, (manager) =>
        manager.getRepository(ObraModel).findOne({
          where: { id: param.obraId, deletedAt: IsNull() },
        }),
      );
      if (!obra)
        return left(
          new ObraRepositoryException({
            code: ErrorCodeConstants.OBRA_NOT_FOUND,
            statusCode: 404,
          }),
        );
      if (userResult.value.tenantId !== ctx.tenantId)
        return left(
          new ObraRepositoryException({
            code: ErrorCodeConstants.OBRA_EQUIPE_INVALID_USUARIO,
            statusCode: 400,
          }),
        );
      const tipo = ObraResponsavelTipo.RESPONSAVEL;
      await withManager(this.ds, this.tc, async (manager) => {
        const repository = manager.getRepository(ObraResponsavelModel);
        const existing = await repository.findOne({
          where: {
            tenantId: ctx.tenantId,
            obraId: param.obraId,
            usuarioId: param.usuarioId,
            tipo,
          },
        });
        if (!existing)
          await repository.save({
            id: randomUUID(),
            tenantId: ctx.tenantId,
            obraId: param.obraId,
            usuarioId: param.usuarioId,
            tipo,
            createdAt: new Date(),
          });
      });
      // idempotence via OR check duplicate usuario+obra+tipo: use unique on (obra_id, usuario_id, tipo) not exists so ON CONFLICT not work, use INSERT ... ON CONFLICT DO NOTHING with unique constraint on (obra_id, usuario_id) if exists, else check beforehand
      // fallback: ensure no duplicate by checking existing
      return right(unit);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(
        new ObraRepositoryException({
          code: ErrorCodeConstants.OBRA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async removeResponsavel(param: {
    obraId: string;
    usuarioId: string;
  }): AsyncResult<AppException, Unit> {
    try {
      const { tenantId } = this.tc.require();
      const obra = await withManager(this.ds, this.tc, (manager) =>
        manager.getRepository(ObraModel).findOne({
          where: { id: param.obraId, deletedAt: IsNull() },
        }),
      );
      if (!obra)
        return left(
          new ObraRepositoryException({
            code: ErrorCodeConstants.OBRA_NOT_FOUND,
            statusCode: 404,
          }),
        );
      await withManager(this.ds, this.tc, (manager) =>
        manager.getRepository(ObraResponsavelModel).delete({
          tenantId,
          obraId: param.obraId,
          usuarioId: param.usuarioId,
          tipo: ObraResponsavelTipo.RESPONSAVEL,
        }),
      );
      return right(unit);
    } catch (cause) {
      return left(
        new ObraRepositoryException({
          code: ErrorCodeConstants.OBRA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async listResponsaveis(
    obraId: string,
  ): AsyncResult<AppException, Array<{ usuarioId: string; tipo: string }>> {
    try {
      const { tenantId } = this.tc.require();
      const rows = await withManager(this.ds, this.tc, (manager) =>
        manager.getRepository(ObraResponsavelModel).find({
          where: { tenantId, obraId },
        }),
      );
      return right(
        rows.map((row) => ({ usuarioId: row.usuarioId, tipo: row.tipo })),
      );
    } catch (cause) {
      return left(
        new ObraRepositoryException({
          code: ErrorCodeConstants.OBRA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async addSeguidor(param: {
    obraId: string;
    usuarioId: string;
  }): AsyncResult<AppException, Unit> {
    try {
      const ctx = this.tc.require();
      const obra = await withManager(this.ds, this.tc, (manager) =>
        manager.getRepository(ObraModel).findOne({
          where: {
            id: param.obraId,
            deletedAt: IsNull(),
          },
        }),
      );
      if (!obra)
        return left(
          new ObraRepositoryException({
            code: ErrorCodeConstants.OBRA_NOT_FOUND,
            statusCode: 404,
          }),
        );
      const userResult = await this.users.findOne({
        id: param.usuarioId,
        tenantId: ctx.tenantId,
      });
      if (userResult.isLeft()) return left(userResult.value);
      if (userResult.value.tenantId !== ctx.tenantId)
        return left(
          new ObraRepositoryException({
            code: ErrorCodeConstants.OBRA_EQUIPE_INVALID_USUARIO,
            statusCode: 400,
          }),
        );
      await withManager(this.ds, this.tc, async (manager) => {
        const repository = manager.getRepository(ObraSeguidorModel);
        const existing = await repository.findOne({
          where: {
            tenantId: ctx.tenantId,
            obraId: param.obraId,
            usuarioId: param.usuarioId,
          },
        });
        if (!existing)
          await repository.save({
            id: randomUUID(),
            tenantId: ctx.tenantId,
            obraId: param.obraId,
            usuarioId: param.usuarioId,
            seguidoEm: new Date(),
          });
      });
      return right(unit);
    } catch (cause) {
      return left(
        new ObraRepositoryException({
          code: ErrorCodeConstants.OBRA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async removeSeguidor(param: {
    obraId: string;
    usuarioId: string;
  }): AsyncResult<AppException, Unit> {
    try {
      const { tenantId } = this.tc.require();
      const obra = await withManager(this.ds, this.tc, (manager) =>
        manager.getRepository(ObraModel).findOne({
          where: { id: param.obraId, deletedAt: IsNull() },
        }),
      );
      if (!obra)
        return left(
          new ObraRepositoryException({
            code: ErrorCodeConstants.OBRA_NOT_FOUND,
            statusCode: 404,
          }),
        );
      await withManager(this.ds, this.tc, (manager) =>
        manager.getRepository(ObraSeguidorModel).delete({
          tenantId,
          obraId: param.obraId,
          usuarioId: param.usuarioId,
        }),
      );
      return right(unit);
    } catch (cause) {
      return left(
        new ObraRepositoryException({
          code: ErrorCodeConstants.OBRA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }

  async listSeguidores(
    obraId: string,
  ): AsyncResult<AppException, Array<{ usuarioId: string }>> {
    try {
      const { tenantId } = this.tc.require();
      const rows = await withManager(this.ds, this.tc, (manager) =>
        manager.getRepository(ObraSeguidorModel).find({
          where: { tenantId, obraId },
        }),
      );
      return right(rows.map((row) => ({ usuarioId: row.usuarioId })));
    } catch (cause) {
      return left(
        new ObraRepositoryException({
          code: ErrorCodeConstants.OBRA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        }),
      );
    }
  }
}
