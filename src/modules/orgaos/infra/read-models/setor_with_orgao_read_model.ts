export interface SetorWithOrgaoReadModel {
  id: string;
  nome: string;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
  orgao: {
    id: string;
    nome: string;
  };
}
