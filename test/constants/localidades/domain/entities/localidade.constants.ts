import { TipoLocalidade } from '@/modules/localidades/domain/enums/tipo_localidade.enum';

export const localidadeIds = Object.freeze({
  tenantId: '9f8b416e-2b4c-4e4a-b1c7-6beeb3d4d7dc',
  userId: '4c67eb4d-b04d-435d-9435-5f1a8d026cf8',
  localidadeId: '631a9b41-0be2-45e9-b7ef-c19099c70a2d',
  foreignLocalidadeId: 'f6ae7ec6-8f9d-4d49-88e8-fad9f267853f',
});

export const validLocalidade = Object.freeze({
  nome: 'Centro',
  uf: 'PI',
  codigoIbge: null,
  tipo: TipoLocalidade.BAIRRO,
  municipio: 'Teresina',
  observacoes: null,
  createdAt: new Date('2026-09-04T10:00:00.000Z'),
  updatedAt: new Date('2026-09-04T10:05:00.000Z'),
});
