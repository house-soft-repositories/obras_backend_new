import ErrorCodeConstants from '@/core/constants/error_code.constants';
import TenantContext from '@/core/multitenancy/tenant_context';
import FiltroObrasDto from '@/modules/relatorios/dtos/filtro_obras.dto';
import { computarDesempenhoObra } from '@/modules/relatorios/domain/logic/desempenho.logic';
import {
  ContagemPorStatusRelatorio,
  LinhaObraRelatorio,
  ObrasPorOrgaoRelatorio,
  ValoresFluxo,
} from '@/modules/relatorios/domain/relatorios/relatorios_read_models';
import RelatoriosRepositoryException from '@/modules/relatorios/exceptions/relatorios_repository.exception';
import { DataSource } from 'typeorm';

type ObraRow = {
  obra_id: string;
  codigo: string;
  nome: string;
  status: string;
  tipo: string;
  acao_conveniada: string | null;
  prioritaria: boolean;
  orgao_id: string | null;
  setor_id: string | null;
  localidade_id: string | null;
  eixo_id: string | null;
  tipologia_id: string | null;
  classificacao_id: string | null;
  data_prazo: string | null;
  created_at: string | Date;
  updated_at: string | Date | null;
  privado: boolean;
  invisivel: boolean;
  criado_por_usuario_id: string | null;
  localidade_nome: string | null;
  orgao_nome: string | null;
  responsavel_usuario_id: string | null;
  responsavel_nome: string | null;
  numero_contrato: string | null;
  empresa_executora: string | null;
  total_contratado: string | null;
  pago_total: string | null;
};

type EstagioRow = {
  id: string;
  obra_id: string;
  nome: string;
  posicao: number;
  data_fim: string | null;
  percentual_direto: string | number | null;
  meta_atual: string | number | null;
};

type TagRow = { obra_id: string; tag_id: string; nome: string };
type LocalizacaoRow = {
  obra_id: string;
  localidade: string;
  uf: string;
  latitude: string | null;
  longitude: string | null;
};
type StatusRow = { status: string; total: string | number };
type OrgaoRow = {
  orgao_id: string;
  orgao_nome: string;
  total: string | number;
};
type FluxoAgregadoRow = { obra_id: string; sum: string | number | null };

const HOJE = () => new Date().toISOString().slice(0, 10);

function paraIso(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  return JSON.stringify(value);
}

function paraData(value: unknown): string | null {
  return paraIso(value)?.slice(0, 10) ?? null;
}

function percentualFinanceiroDe(pago: number, totalContratado: number): number {
  if (totalContratado <= 0) return 0;
  return Number(((pago / totalContratado) * 100).toFixed(2));
}

function agrupar<T>(items: T[], chave: (item: T) => string): Map<string, T[]> {
  const mapa = new Map<string, T[]>();
  for (const item of items) {
    const key = chave(item);
    if (!mapa.has(key)) mapa.set(key, []);
    mapa.get(key)?.push(item);
  }
  return mapa;
}

function visivel(row: ObraRow, usuarioId: string): boolean {
  if (!row.privado && !row.invisivel) return true;
  return (
    row.criado_por_usuario_id === usuarioId ||
    row.responsavel_usuario_id === usuarioId
  );
}

export default class RelatoriosQuery {
  constructor(
    private readonly ds: DataSource,
    private readonly tenantContext: TenantContext,
  ) {}

  private schema(): string {
    return this.tenantContext.require().schemaName;
  }

  private montarLinha(
    obra: ObraRow,
    estagiosDaObra: EstagioRow[],
    tagsDaObra: TagRow[],
    localizacoesDaObra: LocalizacaoRow[],
  ): LinhaObraRelatorio {
    const atual = estagiosDaObra[0] ?? null;
    const desempenho = computarDesempenhoObra({
      status: obra.status,
      prazoConclusao: paraData(atual?.data_fim ?? obra.data_prazo),
      dataReferencia: HOJE(),
      estagiosRaiz: estagiosDaObra.map((estagio) => ({
        percentualRealizado: Number(estagio.percentual_direto ?? 0),
        metaAtual:
          estagio.meta_atual === null ? null : Number(estagio.meta_atual),
      })),
    });
    return {
      obraId: obra.obra_id,
      codigo: obra.codigo,
      nome: obra.nome,
      statusObra: obra.status,
      tipo: obra.tipo,
      estagioAtualId: atual?.id ?? null,
      estagioAtualNome: atual?.nome ?? null,
      prazoConclusaoEstagio: paraData(atual?.data_fim ?? null),
      percentualRealizado: desempenho.percentualRealizado,
      percentualPrevisto: desempenho.percentualPrevisto,
      percentualFinanceiro: percentualFinanceiroDe(
        Number(obra.pago_total ?? 0),
        Number(obra.total_contratado ?? 0),
      ),
      semaforo: desempenho.semaforo,
      prazoVencido: desempenho.prazoVencido,
      orgaoId: obra.orgao_id,
      orgaoNome: obra.orgao_nome,
      setorId: obra.setor_id,
      localidadeId: obra.localidade_id,
      localidadeNome: obra.localidade_nome,
      responsavelUsuarioId: obra.responsavel_usuario_id,
      responsavelNome: obra.responsavel_nome,
      tagIds: tagsDaObra.map((tag) => tag.tag_id),
      tags: tagsDaObra.map((tag) => tag.nome),
      acaoConveniada: obra.acao_conveniada,
      eixoId: obra.eixo_id,
      tipologiaId: obra.tipologia_id,
      classificacaoId: obra.classificacao_id,
      prioritaria: obra.prioritaria,
      empresaExecutora: obra.empresa_executora,
      numeroContrato: obra.numero_contrato,
      localizacoes: localizacoesDaObra.map((localizacao) => ({
        localidade: localizacao.localidade,
        uf: localizacao.uf,
        latitude:
          localizacao.latitude === null
            ? null
            : Number(localizacao.latitude),
        longitude:
          localizacao.longitude === null
            ? null
            : Number(localizacao.longitude),
      })),
      dataCriacao: paraIso(obra.created_at) ?? '',
      ultimaAtualizacao: paraIso(obra.updated_at),
    };
  }

  private fromObrasComJoins(schema: string): string {
    return (
      `FROM "${schema}"."obras" o\n` +
      `            LEFT JOIN "${schema}"."localidades" loc ON loc.id = o.localidade_id\n` +
      `            LEFT JOIN "${schema}"."orgaos" org ON org.id = o.orgao_id\n` +
      `            LEFT JOIN "${schema}"."obra_responsaveis" resp ON resp.obra_id = o.id AND resp.tipo = 'RESPONSAVEL'\n` +
      `            LEFT JOIN public.users u ON u.id = resp.usuario_id\n` +
      `            LEFT JOIN "${schema}"."contrato" c ON c.obra_id = o.id\n` +
      `            LEFT JOIN "${schema}"."empresa_contratada" ec ON ec.id = c.empresa_contratada_id\n` +
      `            LEFT JOIN (SELECT contrato_id, SUM(valor) AS valor FROM "${schema}"."contrato_fonte" GROUP BY contrato_id) fci ON fci.contrato_id = c.id\n` +
      `            LEFT JOIN (SELECT a.contrato_id, SUM(af.valor) AS valor\n` +
      `                         FROM "${schema}"."aditivo" a\n` +
      `                         JOIN "${schema}"."aditivo_fonte" af ON af.aditivo_id = a.id\n` +
      `                        WHERE a.tipo IN ('VALOR', 'PRAZO_E_VALOR')\n` +
      `                        GROUP BY a.contrato_id) fad ON fad.contrato_id = c.id\n` +
      `            LEFT JOIN (SELECT e.obra_id, SUM(p.valor) AS valor\n` +
      `                         FROM "${schema}"."pagamento" p\n` +
      `                         JOIN "${schema}"."empenho" e ON e.id = p.empenho_id\n` +
      `                        GROUP BY e.obra_id) fpg ON fpg.obra_id = o.id\n` +
      // Estágio atual = primeiro por posição (mesma regra do mapeamento em memória).
      `            LEFT JOIN LATERAL (SELECT e.id, e.nome, e.data_fim\n` +
      `                               FROM "${schema}"."estagio" e\n` +
      `                              WHERE e.obra_id = o.id AND e.ativo = true\n` +
      `                              ORDER BY e.posicao ASC, e.id ASC\n` +
      `                              LIMIT 1) est ON true`
    );
  }

  private aplicarWhereFiltro(
    schema: string,
    usuarioId: string,
    filtro: FiltroObrasDto,
    params: unknown[],
  ): string {
    const conditions = ['o.deleted_at IS NULL'];
    let idx = params.length + 1;
    const push = (value: unknown): string => {
      params.push(value);
      return `$${idx++}`;
    };
    // Regra de visibilidade (mesma do visivel() em memória): obra pública
    // ou criada/atribuída ao usuário.
    const visivelParam = push(usuarioId);
    conditions.push(
      `((o.privado = false AND o.invisivel = false) OR o.criado_por_usuario_id = ${visivelParam} OR resp.usuario_id = ${visivelParam})`,
    );
    if (filtro.acaoConveniada)
      conditions.push(`o.acao_conveniada = ${push(filtro.acaoConveniada)}`);
    if (filtro.eixoId) conditions.push(`o.eixo_id = ${push(filtro.eixoId)}`);
    if (filtro.tipologiaId)
      conditions.push(`o.tipologia_id = ${push(filtro.tipologiaId)}`);
    if (filtro.classificacaoId)
      conditions.push(
        `o.classificacao_id = ${push(filtro.classificacaoId)}`,
      );
    if (filtro.tipo) conditions.push(`o.tipo = ${push(filtro.tipo)}`);
    if (filtro.statusObra?.length)
      conditions.push(`o.status = ANY(${push(filtro.statusObra)})`);
    if (filtro.orgaoId)
      conditions.push(`o.orgao_id = ${push(filtro.orgaoId)}`);
    if (filtro.setorId)
      conditions.push(`o.setor_id = ${push(filtro.setorId)}`);
    if (filtro.localidadeId)
      conditions.push(`o.localidade_id = ${push(filtro.localidadeId)}`);
    if (filtro.prioritaria !== undefined)
      conditions.push(
        `o.prioritaria = ${push(filtro.prioritaria === 'true')}`,
      );
    if (filtro.dataCriacaoDe)
      conditions.push(
        `o.created_at::date >= (${push(filtro.dataCriacaoDe)}::date)`,
      );
    if (filtro.dataCriacaoAte)
      conditions.push(
        `o.created_at::date <= (${push(filtro.dataCriacaoAte)}::date)`,
      );
    if (filtro.atualizadoDe)
      conditions.push(
        `o.updated_at::date >= (${push(filtro.atualizadoDe)}::date)`,
      );
    // updated_at nulo passa no filtro Ate (mesma semântica do filtro em memória).
    if (filtro.atualizadoAte)
      conditions.push(
        `(o.updated_at IS NULL OR o.updated_at::date <= (${push(filtro.atualizadoAte)}::date))`,
      );
    if (filtro.prazoEstagioDe)
      conditions.push(
        `est.data_fim >= (${push(filtro.prazoEstagioDe)}::date)`,
      );
    if (filtro.prazoEstagioAte)
      conditions.push(
        `est.data_fim <= (${push(filtro.prazoEstagioAte)}::date)`,
      );
    if (filtro.buscaTextual?.trim()) {
      const termo = `%${filtro.buscaTextual.trim()}%`;
      const termoParam = push(termo);
      conditions.push(
        `(o.nome ILIKE ${termoParam} OR o.codigo ILIKE ${termoParam})`,
      );
    }
    if (filtro.empresaExecutora?.trim())
      conditions.push(
        `ec.razao_social ILIKE ${push(`%${filtro.empresaExecutora.trim()}%`)}`,
      );
    if (filtro.numeroContrato?.trim())
      conditions.push(
        `c.numero ILIKE ${push(`%${filtro.numeroContrato.trim()}%`)}`,
      );
    if (filtro.responsavel?.trim())
      conditions.push(
        `u.name ILIKE ${push(`%${filtro.responsavel.trim()}%`)}`,
      );
    if (filtro.estagioAtual?.trim())
      conditions.push(
        `est.nome ILIKE ${push(`%${filtro.estagioAtual.trim()}%`)}`,
      );
    if (filtro.tagIds?.length)
      conditions.push(
        `EXISTS (SELECT 1 FROM "${schema}"."obra_tag" ot WHERE ot.obra_id = o.id AND ot.tag_id = ANY(${push(filtro.tagIds)}))`,
      );
    return conditions.join(' AND ');
  }

  async carregarLinhas(usuarioId: string): Promise<LinhaObraRelatorio[]> {
    try {
      const schema = this.schema();
      const obras = await this.ds.query<ObraRow[]>(
        `SELECT o.id AS obra_id, o.codigo, o.nome, o.status, o.tipo,
                o.acao_conveniada, o.prioritaria,
                o.orgao_id, o.setor_id, o.localidade_id, o.eixo_id,
                o.tipologia_id, o.classificacao_id, o.data_prazo,
                o.created_at, o.updated_at, o.privado, o.invisivel,
                o.criado_por_usuario_id,
                (loc.nome || '/' || loc.uf) AS localidade_nome,
                org.nome AS orgao_nome,
                resp.usuario_id AS responsavel_usuario_id,
                u.name AS responsavel_nome,
                c.numero AS numero_contrato,
                ec.razao_social AS empresa_executora,
                COALESCE(fci.valor, 0) + COALESCE(fad.valor, 0) AS total_contratado,
                COALESCE(fpg.valor, 0) AS pago_total
           FROM "${schema}"."obras" o
           LEFT JOIN "${schema}"."localidades" loc ON loc.id = o.localidade_id
           LEFT JOIN "${schema}"."orgaos" org ON org.id = o.orgao_id
           LEFT JOIN "${schema}"."obra_responsaveis" resp ON resp.obra_id = o.id AND resp.tipo = 'RESPONSAVEL'
           LEFT JOIN public.users u ON u.id = resp.usuario_id
           LEFT JOIN "${schema}"."contrato" c ON c.obra_id = o.id
           LEFT JOIN "${schema}"."empresa_contratada" ec ON ec.id = c.empresa_contratada_id
           LEFT JOIN (SELECT contrato_id, SUM(valor) AS valor FROM "${schema}"."contrato_fonte" GROUP BY contrato_id) fci ON fci.contrato_id = c.id
           LEFT JOIN (SELECT a.contrato_id, SUM(af.valor) AS valor
                        FROM "${schema}"."aditivo" a
                        JOIN "${schema}"."aditivo_fonte" af ON af.aditivo_id = a.id
                       WHERE a.tipo IN ('VALOR', 'PRAZO_E_VALOR')
                       GROUP BY a.contrato_id) fad ON fad.contrato_id = c.id
           LEFT JOIN (SELECT e.obra_id, SUM(p.valor) AS valor
                        FROM "${schema}"."pagamento" p
                        JOIN "${schema}"."empenho" e ON e.id = p.empenho_id
                       GROUP BY e.obra_id) fpg ON fpg.obra_id = o.id
          WHERE o.deleted_at IS NULL`,
      );

      const [estagios, tags, localizacoes] = await Promise.all([
        this.ds.query<EstagioRow[]>(
          `SELECT e.id, e.obra_id, e.nome, e.posicao, e.data_fim,
                  e.percentual_direto,
                  (SELECT ea.percentual
                     FROM "${schema}"."estagio_acompanhamento" ea
                    WHERE ea.estagio_id = e.id AND ea.data <= $1
                    ORDER BY ea.data DESC, ea.criado_em DESC
                    LIMIT 1) AS meta_atual
             FROM "${schema}"."estagio" e
            WHERE e.ativo = true
            ORDER BY e.obra_id, e.posicao ASC, e.id ASC`,
          [HOJE()],
        ),
        this.ds.query<TagRow[]>(
          `SELECT ot.obra_id, ot.tag_id, t.nome
             FROM "${schema}"."obra_tag" ot
             JOIN "${schema}"."tag" t ON t.id = ot.tag_id`,
        ),
        this.ds.query<LocalizacaoRow[]>(
          `SELECT obra_id, localidade, uf, latitude, longitude
             FROM "${schema}"."obra_localizacao"`,
        ),
      ]);

      const estagiosPorObra = agrupar(estagios, (row) => row.obra_id);
      const tagsPorObra = agrupar(tags, (row) => row.obra_id);
      const localizacoesPorObra = agrupar(localizacoes, (row) => row.obra_id);

      return obras
        .filter((obra) => visivel(obra, usuarioId))
        .map((obra) =>
          this.montarLinha(
            obra,
            estagiosPorObra.get(obra.obra_id) ?? [],
            tagsPorObra.get(obra.obra_id) ?? [],
            localizacoesPorObra.get(obra.obra_id) ?? [],
          ),
        );
    } catch (cause) {
      throw new RelatoriosRepositoryException({
        code: ErrorCodeConstants.RELATORIO_REPOSITORY_FAILED,
        cause,
      });
    }
  }

  async listarComFiltro(
    usuarioId: string,
    filtro: FiltroObrasDto,
  ): Promise<{ linhas: LinhaObraRelatorio[]; total: number }> {
    try {
      const schema = this.schema();
      const from = this.fromObrasComJoins(schema);
      const params: unknown[] = [];
      const where = this.aplicarWhereFiltro(schema, usuarioId, filtro, params);

      const [countRow] = await this.ds.query<{ count: string | number }[]>(
        `SELECT COUNT(DISTINCT o.id)::int AS count ${from} WHERE ${where}`,
        params,
      );
      const total = Number(countRow?.count ?? 0);
      if (total === 0) return { linhas: [], total: 0 };

      const pagina = Math.max(1, Math.floor(filtro.pagina ?? 1));
      const tamanho = Math.max(1, Math.floor(filtro.tamanho ?? 50));
      const offset = (pagina - 1) * tamanho;
      const limiteParam = `$${params.length + 1}`;
      const offsetParam = `$${params.length + 2}`;
      const obras = await this.ds.query<ObraRow[]>(
        `SELECT o.id AS obra_id, o.codigo, o.nome, o.status, o.tipo,
                o.acao_conveniada, o.prioritaria,
                o.orgao_id, o.setor_id, o.localidade_id, o.eixo_id,
                o.tipologia_id, o.classificacao_id, o.data_prazo,
                o.created_at, o.updated_at, o.privado, o.invisivel,
                o.criado_por_usuario_id,
                (loc.nome || '/' || loc.uf) AS localidade_nome,
                org.nome AS orgao_nome,
                resp.usuario_id AS responsavel_usuario_id,
                u.name AS responsavel_nome,
                c.numero AS numero_contrato,
                ec.razao_social AS empresa_executora,
                COALESCE(fci.valor, 0) + COALESCE(fad.valor, 0) AS total_contratado,
                COALESCE(fpg.valor, 0) AS pago_total
           ${from}
          WHERE ${where}
          ORDER BY o.nome ASC
          LIMIT ${limiteParam} OFFSET ${offsetParam}`,
        [...params, tamanho, offset],
      );
      if (obras.length === 0) return { linhas: [], total };

      const obraIds = obras.map((obra) => obra.obra_id);
      const [estagios, tags, localizacoes] = await Promise.all([
        this.ds.query<EstagioRow[]>(
          `SELECT e.id, e.obra_id, e.nome, e.posicao, e.data_fim,
                  e.percentual_direto,
                  (SELECT ea.percentual
                     FROM "${schema}"."estagio_acompanhamento" ea
                    WHERE ea.estagio_id = e.id AND ea.data <= $2
                    ORDER BY ea.data DESC, ea.criado_em DESC
                    LIMIT 1) AS meta_atual
             FROM "${schema}"."estagio" e
            WHERE e.ativo = true AND e.obra_id = ANY($1)
            ORDER BY e.obra_id, e.posicao ASC, e.id ASC`,
          [obraIds, HOJE()],
        ),
        this.ds.query<TagRow[]>(
          `SELECT ot.obra_id, ot.tag_id, t.nome
             FROM "${schema}"."obra_tag" ot
             JOIN "${schema}"."tag" t ON t.id = ot.tag_id
            WHERE ot.obra_id = ANY($1)`,
          [obraIds],
        ),
        this.ds.query<LocalizacaoRow[]>(
          `SELECT obra_id, localidade, uf, latitude, longitude
             FROM "${schema}"."obra_localizacao"
            WHERE obra_id = ANY($1)`,
          [obraIds],
        ),
      ]);

      const estagiosPorObra = agrupar(estagios, (row) => row.obra_id);
      const tagsPorObra = agrupar(tags, (row) => row.obra_id);
      const localizacoesPorObra = agrupar(localizacoes, (row) => row.obra_id);

      let linhas = obras.map((obra) =>
        this.montarLinha(
          obra,
          estagiosPorObra.get(obra.obra_id) ?? [],
          tagsPorObra.get(obra.obra_id) ?? [],
          localizacoesPorObra.get(obra.obra_id) ?? [],
        ),
      );
      // percentualMin/Max são computados por computarDesempenhoObra em memória
      // (sem equivalente pushável no SQL); filtra-se sobre a página.
      // O total acima é pré-percentual.
      if (filtro.percentualMin !== undefined) {
        const minimo = Number(filtro.percentualMin);
        linhas = linhas.filter(
          (linha) => linha.percentualRealizado >= minimo,
        );
      }
      if (filtro.percentualMax !== undefined) {
        const maximo = Number(filtro.percentualMax);
        linhas = linhas.filter(
          (linha) => linha.percentualRealizado <= maximo,
        );
      }
      return { linhas, total };
    } catch (cause) {
      throw new RelatoriosRepositoryException({
        code: ErrorCodeConstants.RELATORIO_REPOSITORY_FAILED,
        cause,
      });
    }
  }

  async valoresFluxoAgregados(
    obraIds: string[],
  ): Promise<Map<string, ValoresFluxo>> {
    const zerados = (): ValoresFluxo => ({
      contratadoInicial: 0,
      aditivadoTotal: 0,
      medidoTotal: 0,
      empenhadoTotal: 0,
      liquidadoTotal: 0,
      pagoTotal: 0,
    });
    const mapa = new Map<string, ValoresFluxo>();
    for (const obraId of obraIds) mapa.set(obraId, zerados());
    if (obraIds.length === 0) return mapa;
    try {
      const schema = this.schema();
      const [contratado, aditivado, medido, empenhado, liquidado, pago] =
        await Promise.all([
          this.ds.query<FluxoAgregadoRow[]>(
            `SELECT c.obra_id, COALESCE(SUM(cf.valor), 0) AS sum FROM "${schema}"."contrato" c JOIN "${schema}"."contrato_fonte" cf ON cf.contrato_id = c.id WHERE c.obra_id = ANY($1) GROUP BY c.obra_id`,
            [obraIds],
          ),
          this.ds.query<FluxoAgregadoRow[]>(
            `SELECT c.obra_id, COALESCE(SUM(af.valor), 0) AS sum FROM "${schema}"."aditivo" ad JOIN "${schema}"."aditivo_fonte" af ON af.aditivo_id = ad.id JOIN "${schema}"."contrato" c ON c.id = ad.contrato_id WHERE c.obra_id = ANY($1) AND ad.tipo IN ('VALOR', 'PRAZO_E_VALOR') GROUP BY c.obra_id`,
            [obraIds],
          ),
          this.ds.query<FluxoAgregadoRow[]>(
            `SELECT m.obra_id, COALESCE(SUM(mf.valor), 0) AS sum FROM "${schema}"."medicao" m JOIN "${schema}"."medicao_fonte" mf ON mf.medicao_id = m.id WHERE m.obra_id = ANY($1) GROUP BY m.obra_id`,
            [obraIds],
          ),
          this.ds.query<FluxoAgregadoRow[]>(
            `SELECT obra_id, COALESCE(SUM(valor), 0) AS sum FROM "${schema}"."empenho" WHERE obra_id = ANY($1) GROUP BY obra_id`,
            [obraIds],
          ),
          this.ds.query<FluxoAgregadoRow[]>(
            `SELECT e.obra_id, COALESCE(SUM(l.valor), 0) AS sum FROM "${schema}"."liquidacao" l JOIN "${schema}"."empenho" e ON e.id = l.empenho_id WHERE e.obra_id = ANY($1) GROUP BY e.obra_id`,
            [obraIds],
          ),
          this.ds.query<FluxoAgregadoRow[]>(
            `SELECT e.obra_id, COALESCE(SUM(p.valor), 0) AS sum FROM "${schema}"."pagamento" p JOIN "${schema}"."empenho" e ON e.id = p.empenho_id WHERE e.obra_id = ANY($1) GROUP BY e.obra_id`,
            [obraIds],
          ),
        ]);
      const aplicar = (
        linhas: FluxoAgregadoRow[],
        campo: keyof ValoresFluxo,
      ): void => {
        for (const linha of linhas) {
          const atual = mapa.get(linha.obra_id);
          if (atual) atual[campo] = Number(linha.sum ?? 0);
        }
      };
      aplicar(contratado, 'contratadoInicial');
      aplicar(aditivado, 'aditivadoTotal');
      aplicar(medido, 'medidoTotal');
      aplicar(empenhado, 'empenhadoTotal');
      aplicar(liquidado, 'liquidadoTotal');
      aplicar(pago, 'pagoTotal');
      return mapa;
    } catch (cause) {
      throw new RelatoriosRepositoryException({
        code: ErrorCodeConstants.RELATORIO_REPOSITORY_FAILED,
        cause,
      });
    }
  }

  async contagens(): Promise<{
    contagemPorStatus: ContagemPorStatusRelatorio;
    obrasPorOrgao: ObrasPorOrgaoRelatorio[];
  }> {
    try {
      const schema = this.schema();
      const porStatus = await this.ds.query<StatusRow[]>(
        `SELECT status, COUNT(*)::int AS total
           FROM "${schema}"."obras"
          WHERE deleted_at IS NULL
          GROUP BY status`,
      );
      const porOrgao = await this.ds.query<OrgaoRow[]>(
        `SELECT o.orgao_id, org.nome AS orgao_nome, COUNT(*)::int AS total
           FROM "${schema}"."obras" o
           JOIN "${schema}"."orgaos" org ON org.id = o.orgao_id
          WHERE o.deleted_at IS NULL
          GROUP BY o.orgao_id, org.nome
          ORDER BY total DESC, org.nome ASC`,
      );
      const contagemPorStatus = this.montarContagemPorStatus(porStatus);
      return {
        contagemPorStatus,
        obrasPorOrgao: porOrgao.map((row) => ({
          orgaoId: row.orgao_id,
          orgaoNome: row.orgao_nome,
          total: Number(row.total),
        })),
      };
    } catch (cause) {
      throw new RelatoriosRepositoryException({
        code: ErrorCodeConstants.RELATORIO_REPOSITORY_FAILED,
        cause,
      });
    }
  }

  montarContagemPorStatus(rows: StatusRow[]): ContagemPorStatusRelatorio {
    const porStatus = new Map(
      rows.map((row) => [row.status, Number(row.total)]),
    );
    const contagem = {
      emAberto: porStatus.get('EM_ABERTO') ?? 0,
      emDesenvolvimento: porStatus.get('EM_DESENVOLVIMENTO') ?? 0,
      concluidas: porStatus.get('CONCLUIDO') ?? 0,
      paralisadas: porStatus.get('PARALISADO') ?? 0,
      canceladas: porStatus.get('CANCELADO') ?? 0,
    };
    return {
      total:
        contagem.emAberto +
        contagem.emDesenvolvimento +
        contagem.concluidas +
        contagem.paralisadas +
        contagem.canceladas,
      ...contagem,
    };
  }

  async carregarDetalheObra(obraId: string) {
    const schema = this.schema();
    const [[obra], estagios, medicoes] = await Promise.all([
      this.ds.query<Record<string, unknown>[]>(
        `SELECT nome, status, descricao FROM "${schema}"."obras" WHERE id=$1 AND deleted_at IS NULL`,
        [obraId],
      ),
      this.ds.query<Record<string, unknown>[]>(
        `SELECT nome, percentual_direto, data_fim, status
           FROM "${schema}"."estagio"
          WHERE obra_id=$1 AND ativo=true
          ORDER BY posicao`,
        [obraId],
      ),
      this.ds.query<Record<string, unknown>[]>(
        `SELECT m.numero, m.data, m.tipo, COALESCE(SUM(mf.valor), 0) AS valor
           FROM "${schema}"."medicao" m
           LEFT JOIN "${schema}"."medicao_fonte" mf ON mf.medicao_id = m.id
          WHERE m.obra_id=$1
          GROUP BY m.id
          ORDER BY m.numero`,
        [obraId],
      ),
    ]);
    return { obra, estagios, medicoes };
  }
}
