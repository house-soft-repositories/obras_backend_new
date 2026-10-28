import { right } from '@/core/types/either';
import TenantContext from '@/core/multitenancy/tenant_context';
import GetObraService from '@/modules/obras/application/get_obra.service';
import type IObraRepository from '@/modules/obras/adapters/obra_repository.interface';
import ObraEntity from '@/modules/obras/domain/entities/obra.entity';
import { UserRole } from '@/modules/users/domain/enums/user_role.enum';

const obra = ObraEntity.create({
  codigo: 'OBR-2026-0001',
  nome: 'Reforma Escola',
  tipo: 'OBRA',
  orgaoId: 'org-1',
  criadoPorUsuarioId: 'user-1',
});

describe('GetObraService', () => {
  it('returns a response with the responsible read model', async () => {
    const repository = {
      findOneWithRelations: jest.fn().mockResolvedValue(
        right({
          obra,
          responsavel: {
            id: 'staff-1',
            name: 'Staff',
            email: 'staff@example.com',
            role: UserRole.STAFF,
          },
        }),
      ),
    } as unknown as jest.Mocked<IObraRepository>;
    const tenantContext = {
      require: jest.fn().mockReturnValue({ tenantId: 'tenant-1' }),
    } as unknown as TenantContext;

    const result = await new GetObraService(repository, tenantContext).execute({
      id: obra.id,
    });

    expect(result.isRight()).toBe(true);
    if (result.isLeft()) throw new Error('expected success');
    expect(result.value.fromResponse().responsavel).toEqual({
      id: 'staff-1',
      name: 'Staff',
      email: 'staff@example.com',
      role: UserRole.STAFF,
    });
  });
});
