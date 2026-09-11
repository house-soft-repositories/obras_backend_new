import { right } from '@/core/types/either';

const mockGetMeUseCase = () => ({
  execute: jest.fn().mockResolvedValue(
    right({
      id: '4c67eb4d-b04d-435d-9435-5f1a8d026cf8',
      name: 'Usuário de Exemplo',
      email: 'user@example.com',
      role: 'USER' as any,
      tenant: null,
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-01T00:00:00.000Z'),
    }),
  ),
});

export default mockGetMeUseCase;
