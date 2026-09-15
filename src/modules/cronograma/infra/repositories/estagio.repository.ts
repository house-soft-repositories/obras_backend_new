import { DataSource } from 'typeorm';
import TenantContext from '@/core/multitenancy/tenant_context';
import AppException from '@/core/exceptions/app_exception';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import PageEntity from '@/core/pagination/domain/entities/page.entity';
import PageMetaEntity from '@/core/pagination/domain/entities/page_meta.entity';
import PageOptionsEntity from '@/core/pagination/domain/entities/page_options.entity';
import IEstagioRepository from '@/modules/cronograma/adapters/estagio_repository.interface';
import EstagioEntity from '@/modules/cronograma/domain/entities/estagio.entity';
import EstagioAcompanhamentoEntity from '@/modules/cronograma/domain/entities/estagio_acompanhamento.entity';
import EstagioComentarioEntity from '@/modules/cronograma/domain/entities/estagio_comentario.entity';
import EstagioMapper from '@/modules/cronograma/infra/mapper/estagio.mapper';
import CronogramaRepositoryException from '@/modules/cronograma/exceptions/cronograma_repository.exception';
export default class EstagioRepository implements IEstagioRepository {
  constructor(
    private readonly ds: DataSource,
    private readonly tc: TenantContext,
  ) {}
  private schema() {
    return this.tc.require().schemaName;
  }
  async save(e: EstagioEntity): AsyncResult<AppException, EstagioEntity> {
    try {
      const s = this.schema(),
        v = EstagioMapper.toModel(e);
      const [row] = await this.ds.query(
        `INSERT INTO "${s}"."estagio" (id,tenant_id,obra_id,nome,posicao,ativo,status,modo_duracao,data_inicio,data_fim,percentual_direto,responsavel_usuario_id,criado_em,atualizado_em) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
        Object.values(v),
      );
      return right(EstagioMapper.toEntity(row));
    } catch (cause) {
      return left(
        new CronogramaRepositoryException({
          code: ErrorCodeConstants.CRONOGRAMA_REPOSITORY_FAILED,
          cause,
        }),
      );
    }
  }
  async saveMany(
    items: EstagioEntity[],
  ): AsyncResult<AppException, EstagioEntity[]> {
    try {
      const s = this.schema();
      const q = this.ds.createQueryRunner();
      await q.connect();
      await q.startTransaction();
      try {
        const saved: EstagioEntity[] = [];
        for (const item of items) {
          const v = EstagioMapper.toModel(item);
          const [row] = await q.query(
            `INSERT INTO "${s}"."estagio" (id,tenant_id,obra_id,nome,posicao,ativo,status,modo_duracao,data_inicio,data_fim,percentual_direto,responsavel_usuario_id,criado_em,atualizado_em) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
            Object.values(v),
          );
          saved.push(EstagioMapper.toEntity(row));
        }
        await q.commitTransaction();
        return right(saved);
      } catch (cause) {
        await q.rollbackTransaction();
        return left(
          new CronogramaRepositoryException({
            code: ErrorCodeConstants.CRONOGRAMA_REPOSITORY_FAILED,
            cause,
          }),
        );
      } finally {
        await q.release();
      }
    } catch (cause) {
      return left(
        new CronogramaRepositoryException({
          code: ErrorCodeConstants.CRONOGRAMA_REPOSITORY_FAILED,
          cause,
        }),
      );
    }
  }
  async findById(
    id: string,
    obraId: string,
  ): AsyncResult<AppException, EstagioEntity> {
    try {
      const [row] = await this.ds.query(
        `SELECT * FROM "${this.schema()}"."estagio" WHERE id=$1 AND obra_id=$2`,
        [id, obraId],
      );
      if (!row)
        return left(
          new CronogramaRepositoryException({
            code: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
            statusCode: 404,
          }),
        );
      return right(EstagioMapper.toEntity(row));
    } catch (cause) {
      return left(
        new CronogramaRepositoryException({
          code: ErrorCodeConstants.CRONOGRAMA_REPOSITORY_FAILED,
          cause,
        }),
      );
    }
  }
  async list(
    obraId: string,
    o: PageOptionsEntity,
  ): AsyncResult<AppException, PageEntity<EstagioEntity>> {
    try {
      const s = this.schema(),
        offset = (o.page - 1) * o.take;
      const rows = await this.ds.query(
        `SELECT * FROM "${s}"."estagio" WHERE obra_id=$1 ORDER BY posicao ASC,id ASC LIMIT $2 OFFSET $3`,
        [obraId, o.take, offset],
      );
      const [{ count }] = await this.ds.query(
        `SELECT COUNT(*)::int AS count FROM "${s}"."estagio" WHERE obra_id=$1`,
        [obraId],
      );
      return right(
        new PageEntity(
          rows.map(EstagioMapper.toEntity),
          new PageMetaEntity({ pageOptions: o, itemCount: count }),
        ),
      );
    } catch (cause) {
      return left(
        new CronogramaRepositoryException({
          code: ErrorCodeConstants.CRONOGRAMA_REPOSITORY_FAILED,
          cause,
        }),
      );
    }
  }
  async update(e: EstagioEntity): AsyncResult<AppException, EstagioEntity> {
    try {
      const [row] = await this.ds.query(
        `UPDATE "${this.schema()}"."estagio" SET nome=$1,posicao=$2,modo_duracao=$3,data_inicio=$4,data_fim=$5,percentual_direto=$6,responsavel_usuario_id=$7,atualizado_em=$8 WHERE id=$9 AND obra_id=$10 RETURNING *`,
        [
          e.nome,
          e.posicao,
          e.modoDuracao,
          e.dataInicio,
          e.dataFim,
          e.percentualDireto,
          e.responsavelUsuarioId,
          e.atualizadoEm,
          e.id,
          e.obraId,
        ],
      );
      if (!row)
        return left(
          new CronogramaRepositoryException({
            code: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
            statusCode: 404,
          }),
        );
      return right(EstagioMapper.toEntity(row));
    } catch (cause) {
      return left(
        new CronogramaRepositoryException({
          code: ErrorCodeConstants.CRONOGRAMA_REPOSITORY_FAILED,
          cause,
        }),
      );
    }
  }
  async remove(id: string, obraId: string): AsyncResult<AppException, void> {
    try {
      const [row] = await this.ds.query(
        `DELETE FROM "${this.schema()}"."estagio" WHERE id=$1 AND obra_id=$2 RETURNING id`,
        [id, obraId],
      );
      if (!row)
        return left(
          new CronogramaRepositoryException({
            code: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
            statusCode: 404,
          }),
        );
      return right(undefined);
    } catch (cause) {
      return left(
        new CronogramaRepositoryException({
          code: ErrorCodeConstants.CRONOGRAMA_REPOSITORY_FAILED,
          cause,
        }),
      );
    }
  }
  async reorder(
    obraId: string,
    items: { id: string; posicao: number }[],
  ): AsyncResult<AppException, void> {
    try {
      const s = this.schema();
      const q = this.ds.createQueryRunner();
      await q.connect();
      await q.startTransaction();
      try {
        for (const item of items) {
          const [row] = await q.query(
            `UPDATE "${s}"."estagio" SET posicao=$1,atualizado_em=now() WHERE id=$2 AND obra_id=$3 RETURNING id`,
            [item.posicao, item.id, obraId],
          );
          if (!row) {
            await q.rollbackTransaction();
            return left(
              new CronogramaRepositoryException({
                code: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
                statusCode: 404,
              }),
            );
          }
        }
        await q.commitTransaction();
        return right(undefined);
      } catch (cause) {
        await q.rollbackTransaction();
        return left(
          new CronogramaRepositoryException({
            code: ErrorCodeConstants.CRONOGRAMA_REPOSITORY_FAILED,
            cause,
          }),
        );
      } finally {
        await q.release();
      }
    } catch (cause) {
      return left(
        new CronogramaRepositoryException({
          code: ErrorCodeConstants.CRONOGRAMA_REPOSITORY_FAILED,
          cause,
        }),
      );
    }
  }

  async saveAcompanhamento(
    item: EstagioAcompanhamentoEntity,
  ): AsyncResult<AppException, EstagioAcompanhamentoEntity> {
    try {
      const [row] = await this.ds.query(
        `INSERT INTO "${this.schema()}"."estagio_acompanhamento" (id,tenant_id,obra_id,estagio_id,percentual,data,observacao,autor_usuario_id,criado_em) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [
          item.id,
          item.tenantId,
          item.obraId,
          item.estagioId,
          item.percentual,
          item.data,
          item.observacao,
          item.autorUsuarioId,
          item.criadoEm,
        ],
      );
      return right(
        EstagioAcompanhamentoEntity.fromData({
          id: row.id,
          tenantId: row.tenant_id,
          obraId: row.obra_id,
          estagioId: row.estagio_id,
          percentual: Number(row.percentual),
          data: row.data,
          observacao: row.observacao,
          autorUsuarioId: row.autor_usuario_id,
          criadoEm: row.criado_em,
        }),
      );
    } catch (cause) {
      return left(
        new CronogramaRepositoryException({
          code: ErrorCodeConstants.CRONOGRAMA_REPOSITORY_FAILED,
          cause,
        }),
      );
    }
  }

  async saveComentario(
    item: EstagioComentarioEntity,
  ): AsyncResult<AppException, EstagioComentarioEntity> {
    try {
      const [row] = await this.ds.query(
        `INSERT INTO "${this.schema()}"."estagio_comentario" (id,tenant_id,obra_id,estagio_id,texto,autor_usuario_id,criado_em) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [
          item.id,
          item.tenantId,
          item.obraId,
          item.estagioId,
          item.texto,
          item.autorUsuarioId,
          item.criadoEm,
        ],
      );
      return right(
        EstagioComentarioEntity.fromData({
          id: row.id,
          tenantId: row.tenant_id,
          obraId: row.obra_id,
          estagioId: row.estagio_id,
          texto: row.texto,
          autorUsuarioId: row.autor_usuario_id,
          criadoEm: row.criado_em,
        }),
      );
    } catch (cause) {
      return left(
        new CronogramaRepositoryException({
          code: ErrorCodeConstants.CRONOGRAMA_REPOSITORY_FAILED,
          cause,
        }),
      );
    }
  }

  async updatePercentualDireto(
    obraId: string,
    id: string,
    percentual: number,
  ): AsyncResult<AppException, EstagioEntity> {
    try {
      const [row] = await this.ds.query(
        `UPDATE "${this.schema()}"."estagio" SET percentual_direto=$1,atualizado_em=now() WHERE id=$2 AND obra_id=$3 RETURNING *`,
        [percentual, id, obraId],
      );
      if (!row)
        return left(
          new CronogramaRepositoryException({
            code: ErrorCodeConstants.CRONOGRAMA_NOT_FOUND,
            statusCode: 404,
          }),
        );
      return right(EstagioMapper.toEntity(row));
    } catch (cause) {
      return left(
        new CronogramaRepositoryException({
          code: ErrorCodeConstants.CRONOGRAMA_REPOSITORY_FAILED,
          cause,
        }),
      );
    }
  }

  async datasAgregadas(
    obraId: string,
  ): AsyncResult<
    AppException,
    { dataInicio: string | null; dataFim: string | null }
  > {
    try {
      const [row] = await this.ds.query(
        `SELECT MIN(data_inicio)::text AS data_inicio, MAX(data_fim)::text AS data_fim FROM "${this.schema()}"."estagio" WHERE obra_id=$1`,
        [obraId],
      );
      return right({ dataInicio: row.data_inicio, dataFim: row.data_fim });
    } catch (cause) {
      return left(
        new CronogramaRepositoryException({
          code: ErrorCodeConstants.CRONOGRAMA_REPOSITORY_FAILED,
          cause,
        }),
      );
    }
  }
}
