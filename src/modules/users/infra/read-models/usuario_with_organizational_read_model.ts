import { UserProps } from '@/modules/users/domain/entities/user.entity';

export type UsuarioWithOrganizationalReadModel = Pick<
  UserProps,
  'id' | 'name' | 'email' | 'role' | 'tenantId' | 'createdAt' | 'updatedAt'
> & {
  localidade: { id: string; nome: string; uf: string } | null;
  orgao: { id: string; nome: string; sigla: string | null } | null;
  setor: { id: string; nome: string; orgaoId: string } | null;
};
