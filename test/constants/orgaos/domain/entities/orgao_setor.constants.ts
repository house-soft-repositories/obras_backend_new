import { TipoOrgao } from '@/modules/orgaos/domain/enums/tipo_orgao.enum';

export const orgaoIds = Object.freeze({
  tenantId: '9f8b416e-2b4c-4e4a-b1c7-6beeb3d4d7dc',
  userId: '4c67eb4d-b04d-435d-9435-5f1a8d026cf8',
  localidadeId: '631a9b41-0be2-45e9-b7ef-c19099c70a2d',
  orgaoId: '2edc0cc6-72d5-4e3c-8774-20c06004990d',
  setorId: 'd6aa47dc-99f5-46a3-82f4-2aa395d2e7a2',
});

export const validOrgao = Object.freeze({
  localidadeId: orgaoIds.localidadeId,
  nome: 'Secretaria de Obras',
  sigla: 'SEOB',
  tipo: TipoOrgao.SECRETARIA,
  responsavel: 'Maria',
  email: 'gestao@example.com',
  telefone: '85999990000',
  ativo: true,
  createdAt: new Date('2026-09-04T10:00:00.000Z'),
  updatedAt: new Date('2026-09-04T10:05:00.000Z'),
});

export const validSetor = Object.freeze({
  orgaoId: orgaoIds.orgaoId,
  nome: 'Engenharia',
  ativo: true,
  createdAt: new Date('2026-09-04T10:00:00.000Z'),
  updatedAt: new Date('2026-09-04T10:05:00.000Z'),
});
