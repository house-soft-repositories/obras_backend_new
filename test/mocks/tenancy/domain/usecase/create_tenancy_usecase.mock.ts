import ICreateTenancyUseCase from '@/modules/tenancy/domain/usecase/create_tenancy.usecase';

const mockCreateTenancyUseCase = (): jest.Mocked<ICreateTenancyUseCase> => ({
  execute: jest.fn(),
});

export default mockCreateTenancyUseCase;
