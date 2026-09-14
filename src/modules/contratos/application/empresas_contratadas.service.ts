import AppException from '@/core/exceptions/app_exception';
import TenantContext from '@/core/multitenancy/tenant_context';
import AsyncResult from '@/core/types/async_result';
import { left, right } from '@/core/types/either';
import IEmpresaContratadaRepository from '@/modules/contratos/adapters/empresa_contratada_repository.interface';
import EmpresaContratadaEntity from '@/modules/contratos/domain/entities/empresa_contratada.entity';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import EmpresaRepositoryException from '@/modules/contratos/exceptions/empresa_repository.exception';
export default class EmpresasContratadasService {
  constructor(
    private readonly repo: IEmpresaContratadaRepository,
    private readonly tc: TenantContext,
  ) {}
  async create(param: {
    razaoSocial: string;
    cnpj: string;
    nomeFantasia?: string | null;
    responsavel?: string | null;
    email?: string | null;
    cargoResponsavel?: string | null;
    cep?: string | null;
    logradouro?: string | null;
    numero?: string | null;
    complemento?: string | null;
    bairro?: string | null;
    cidade?: string | null;
    uf?: string | null;
    telefones?: string[];
  }): AsyncResult<AppException, EmpresaContratadaEntity> {
    try {
      const ctx = this.tc.require();
      const exists = await this.repo.existsCnpj(param.cnpj.replace(/\D/g, ''));
      if (exists.isLeft()) return left(exists.value);
      if (exists.value)
        return left(
          new EmpresaRepositoryException({
            code: ErrorCodeConstants.EMPRESA_DUPLICATE_CNPJ,
            statusCode: 409,
          } as any),
        );
      const entity = EmpresaContratadaEntity.create({
        tenantId: ctx.tenantId,
        razaoSocial: param.razaoSocial,
        cnpj: param.cnpj,
        nomeFantasia: param.nomeFantasia ?? null,
        responsavel: param.responsavel ?? null,
        email: param.email ?? null,
        cargoResponsavel: param.cargoResponsavel ?? null,
        cep: param.cep ?? null,
        logradouro: param.logradouro ?? null,
        numero: param.numero ?? null,
        complemento: param.complemento ?? null,
        bairro: param.bairro ?? null,
        cidade: param.cidade ?? null,
        uf: param.uf ?? null,
        telefones: param.telefones ?? [],
      });
      return this.repo.save(entity);
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(
        new EmpresaRepositoryException({
          code: ErrorCodeConstants.EMPRESA_REPOSITORY_FAILED,
          statusCode: 500,
          cause,
        } as any),
      );
    }
  }
  async list(pageOptions: any) {
    return this.repo.findPage(pageOptions);
  }
  async getById(id: string): AsyncResult<AppException, EmpresaContratadaEntity> {
    const found = await this.repo.findById(id);
    if (found.isLeft()) return left(found.value);
    if (!found.value) return left(new EmpresaRepositoryException({ code: ErrorCodeConstants.EMPRESA_CONTRATADA_NOT_FOUND, statusCode: 404 }));
    return right(found.value);
  }
  async update(id: string, param: Partial<ReturnType<EmpresaContratadaEntity['toObject']>>): AsyncResult<AppException, EmpresaContratadaEntity> {
    try {
      const found = await this.getById(id);
      if (found.isLeft()) return left(found.value);
      const previous = found.value.toObject();
      const candidate = EmpresaContratadaEntity.create({ ...previous, ...param, tenantId: previous.tenantId, razaoSocial: param.razaoSocial ?? previous.razaoSocial, cnpj: param.cnpj ?? previous.cnpj, telefones: param.telefones ?? previous.telefones }).toObject();
      const duplicate = await this.repo.existsCnpj(candidate.cnpj, id);
      if (duplicate.isLeft()) return left(duplicate.value);
      if (duplicate.value) return left(new EmpresaRepositoryException({ code: ErrorCodeConstants.EMPRESA_DUPLICATE_CNPJ, statusCode: 409 }));
      return this.repo.save(EmpresaContratadaEntity.fromData({ ...candidate, id: previous.id, createdAt: previous.createdAt, updatedAt: new Date() }));
    } catch (cause) {
      if (cause instanceof AppException) return left(cause);
      return left(new EmpresaRepositoryException({ code: ErrorCodeConstants.EMPRESA_REPOSITORY_FAILED, statusCode: 500, cause }));
    }
  }
  async delete(id: string): AsyncResult<AppException, void> {
    const found = await this.getById(id);
    if (found.isLeft()) return left(found.value);
    return this.repo.delete(id);
  }
}
