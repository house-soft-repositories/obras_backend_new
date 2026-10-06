import ObraPrivadaArquivoEntity from '@/modules/obras-privadas/domain/entities/obra_privada_arquivo.entity';
import {
  CategoriaArquivoPrivado,
  VinculoArquivoPrivado,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';
import type {
  ArquivoUploadItemParam,
  UploadArquivoPreparado,
} from '@/modules/obras-privadas/domain/usecase/iniciar_upload_arquivo.usecase';
import ObraPrivadaArquivoMapper from '@/modules/obras-privadas/infra/mapper/obra_privada_arquivo.mapper';
import ObraPrivadaArquivoModel from '@/modules/obras-privadas/infra/models/obra_privada_arquivo.model';
import { buildObraPrivadaArquivoStorageKey } from '@/modules/obras-privadas/infra/storage/obra_privada_arquivo_storage_key';
import type IStorageService from '@/modules/storage/adapters/storage_service.interface';
import type { EntityManager } from 'typeorm';

type PrepareArquivoPrivadoUploadParam = {
  manager: EntityManager;
  schema: string;
  storage: IStorageService;
  tenantId: string;
  obraPrivadaId: string;
  vinculo: VinculoArquivoPrivado;
  vinculoId: string;
  arquivo: ArquivoUploadItemParam;
  usuarioId: string;
};

export default async function prepareArquivoPrivadoUpload({
  manager,
  schema,
  storage,
  tenantId,
  obraPrivadaId,
  vinculo,
  vinculoId,
  arquivo,
  usuarioId,
}: PrepareArquivoPrivadoUploadParam): Promise<UploadArquivoPreparado> {
  const storageKey = buildObraPrivadaArquivoStorageKey(
    schema,
    obraPrivadaId,
    arquivo.nomeOriginal,
  );
  const entity = ObraPrivadaArquivoEntity.create({
    tenantId,
    obraPrivadaId,
    vinculo,
    vinculoId,
    categoria: arquivo.categoria ?? CategoriaArquivoPrivado.DOCUMENTO,
    nome: arquivo.nome,
    descricao: arquivo.descricao,
    nomeOriginal: arquivo.nomeOriginal,
    mimeType: arquivo.mimeType,
    ordem: arquivo.ordem,
    latitude: arquivo.latitude,
    longitude: arquivo.longitude,
    capturadoEm: arquivo.capturadoEm ? new Date(arquivo.capturadoEm) : undefined,
    storageKey,
    enviadoPorUsuarioId: usuarioId,
  });
  const props = entity.toObject();
  await manager
    .getRepository(ObraPrivadaArquivoModel)
    .save(ObraPrivadaArquivoMapper.toModel(entity));
  const url = await storage.getUploadUrl(
    props.storageKey,
    props.mimeType ?? 'application/octet-stream',
  );
  if (url.isLeft()) throw url.value;
  return {
    arquivoId: props.id,
    nome: props.nome,
    urlUpload: url.value,
  };
}
