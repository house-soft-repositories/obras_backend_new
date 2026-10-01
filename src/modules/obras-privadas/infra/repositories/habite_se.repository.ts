import ErrorCodeConstants from '@/core/constants/error_code.constants';
import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { unit, type Unit } from '@/core/types/unit';
import { left, right } from '@/core/types/either';
import IHabiteSeRepository, {
  HabiteSeUpdate,
} from '@/modules/obras-privadas/adapters/habite_se_repository.interface';
import HabiteSeEntity from '@/modules/obras-privadas/domain/entities/habite_se.entity';
import HabiteSeRepositoryException from '@/modules/obras-privadas/exceptions/habite_se_repository.exception';
import HabiteSeMapper from '@/modules/obras-privadas/infra/mapper/habite_se.mapper';
import HabiteSeModel from '@/modules/obras-privadas/infra/models/habite_se.model';
import { DataSource } from 'typeorm';

const SELECT_COLUMNS = `id, tenant_id AS "tenantId", obra_privada_id AS "obraPrivadaId", numero, data_emissao AS "dataEmissao", parcial, descricao_parcial AS "descricaoParcial", data_vistoria AS "dataVistoria", vistoriador_usuario_id AS "vistoriadorUsuarioId", fiscalizacao_id AS "fiscalizacaoId", resultado, area_construida_executada_m2 AS "areaConstruidaExecutadaM2", divergencia_projeto AS "divergenciaProjeto", divergencia_descricao AS "divergenciaDescricao", parecer, arquivo_id AS "arquivoId", created_at AS "createdAt", updated_at AS "updatedAt"`;
const UPDATE_COLUMNS: Record<keyof HabiteSeUpdate, string> = {
  id: 'id',
  tenantId: 'tenant_id',
  obraPrivadaId: 'obra_privada_id',
  numero: 'numero',
  dataEmissao: 'data_emissao',
  parcial: 'parcial',
  descricaoParcial: 'descricao_parcial',
  dataVistoria: 'data_vistoria',
  vistoriadorUsuarioId: 'vistoriador_usuario_id',
  fiscalizacaoId: 'fiscalizacao_id',
  resultado: 'resultado',
  areaConstruidaExecutadaM2: 'area_construida_executada_m2',
  divergenciaProjeto: 'divergencia_projeto',
  divergenciaDescricao: 'divergencia_descricao',
  parecer: 'parecer',
  arquivoId: 'arquivo_id',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};
export default class HabiteSeRepository implements IHabiteSeRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly tenantContext: TenantContext,
  ) {}
  async save(
    entity: HabiteSeEntity,
  ): AsyncResult<AppException, HabiteSeEntity> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const model = HabiteSeMapper.toModel(entity);
      const [saved] = await this.dataSource.query<HabiteSeModel[]>(
        `INSERT INTO "${schema}"."habite_se" (id, tenant_id, obra_privada_id, numero, data_emissao, parcial, descricao_parcial, data_vistoria, vistoriador_usuario_id, fiscalizacao_id, resultado, area_construida_executada_m2, divergencia_projeto, divergencia_descricao, parecer, arquivo_id, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING ${SELECT_COLUMNS}`,
        [
          model.id,
          model.tenantId,
          model.obraPrivadaId,
          model.numero,
          model.dataEmissao,
          model.parcial,
          model.descricaoParcial,
          model.dataVistoria,
          model.vistoriadorUsuarioId,
          model.fiscalizacaoId,
          model.resultado,
          model.areaConstruidaExecutadaM2,
          model.divergenciaProjeto,
          model.divergenciaDescricao,
          model.parecer,
          model.arquivoId,
          model.createdAt,
          model.updatedAt,
        ],
      );
      return right(HabiteSeMapper.toEntity(saved as HabiteSeModel));
    } catch (cause) {
      return left(this.failed(cause));
    }
  }
  async findById(id: string): AsyncResult<AppException, HabiteSeEntity | null> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const [row] = await this.dataSource.query<HabiteSeModel[]>(
        `SELECT ${SELECT_COLUMNS} FROM "${schema}"."habite_se" WHERE id = $1`,
        [id],
      );
      return right(row ? HabiteSeMapper.toEntity(row as HabiteSeModel) : null);
    } catch (cause) {
      return left(this.failed(cause));
    }
  }
  async findByObraPrivadaId(
    obraPrivadaId: string,
  ): AsyncResult<AppException, HabiteSeEntity[]> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const rows = await this.dataSource.query<HabiteSeModel[]>(
        `SELECT ${SELECT_COLUMNS} FROM "${schema}"."habite_se" WHERE obra_privada_id = $1 ORDER BY data_emissao DESC NULLS LAST, created_at DESC`,
        [obraPrivadaId],
      );
      return right(
        rows.map((row) => HabiteSeMapper.toEntity(row as HabiteSeModel)),
      );
    } catch (cause) {
      return left(this.failed(cause));
    }
  }
  async update(
    id: string,
    props: HabiteSeUpdate,
  ): AsyncResult<AppException, HabiteSeEntity | null> {
    try {
      const schema = this.tenantContext.require().schemaName;
      const entries = Object.entries(props).filter(
        ([property, value]) =>
          value !== undefined &&
          ![
            'id',
            'tenantId',
            'obraPrivadaId',
            'createdAt',
            'updatedAt',
          ].includes(property),
      ) as [keyof HabiteSeUpdate, HabiteSeUpdate[keyof HabiteSeUpdate]][];
      if (entries.length === 0) return this.findById(id);
      const setSql = entries
        .map(
          ([property], index) => `${UPDATE_COLUMNS[property]} = $${index + 2}`,
        )
        .join(', ');
      const [row] = await this.dataSource.query<HabiteSeModel[]>(
        `UPDATE "${schema}"."habite_se" SET ${setSql}, updated_at = now() WHERE id = $1 RETURNING ${SELECT_COLUMNS}`,
        [id, ...entries.map(([, value]) => value)],
      );
      return right(row ? HabiteSeMapper.toEntity(row as HabiteSeModel) : null);
    } catch (cause) {
      return left(this.failed(cause));
    }
  }
  async delete(id: string): AsyncResult<AppException, Unit> {
    try {
      const schema = this.tenantContext.require().schemaName;
      await this.dataSource.query(
        `DELETE FROM "${schema}"."habite_se" WHERE id = $1`,
        [id],
      );
      return right(unit);
    } catch (cause) {
      return left(this.failed(cause));
    }
  }
  private failed(cause: unknown): HabiteSeRepositoryException {
    return new HabiteSeRepositoryException({
      code: ErrorCodeConstants.HABITE_SE_REPOSITORY_FAILED,
      statusCode: 500,
      cause,
    });
  }
}
