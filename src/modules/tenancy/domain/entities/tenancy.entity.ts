import { randomUUID } from 'node:crypto';
import ErrorCodeConstants from '@/core/constants/error_code.constants';
import TenancyDomainException from '@/modules/tenancy/exceptions/tenancy_domain.exception';

export interface TenancyProps {
  id: string;
  name: string;
  slug: string;
  cnpj: string | null;
  active: boolean;
  schemaName: string;
  createdAt: Date;
  updatedAt: Date;
}

export default class TenancyEntity {
  private constructor(private readonly props: TenancyProps) {}

  static create(params: Pick<TenancyProps, 'name' | 'slug' | 'cnpj'>): TenancyEntity {
    if (params.name.trim().length < 2) {
      throw new TenancyDomainException({ code: ErrorCodeConstants.TENANCY_INVALID_NAME });
    }
    if (!/^[a-z0-9-]+$/.test(params.slug)) {
      throw new TenancyDomainException({ code: ErrorCodeConstants.TENANCY_INVALID_SLUG });
    }
    if (params.cnpj && !/^\d{14}$/.test(params.cnpj)) {
      throw new TenancyDomainException({ code: ErrorCodeConstants.TENANCY_INVALID_CNPJ });
    }

    const id = randomUUID();
    const now = new Date();
    return new TenancyEntity({
      id,
      name: params.name.trim(),
      slug: params.slug,
      cnpj: params.cnpj,
      active: true,
      schemaName: `tenant_${id.replaceAll('-', '')}`,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromData(props: TenancyProps): TenancyEntity {
    return new TenancyEntity(props);
  }

  get id() { return this.props.id; }
  get name() { return this.props.name; }
  get slug() { return this.props.slug; }
  get cnpj() { return this.props.cnpj; }
  get active() { return this.props.active; }
  get schemaName() { return this.props.schemaName; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }
}
