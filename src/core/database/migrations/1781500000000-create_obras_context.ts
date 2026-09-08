import { MigrationInterface, QueryRunner } from 'typeorm';
import TenantIdentitySchema from '@/core/multitenancy/tenant_identity_schema';
export class CreateObrasContext1781500000000 implements MigrationInterface {
  name='CreateObrasContext1781500000000';
  async up(q: QueryRunner): Promise<void> {
    const tenancies = await q.query(`SELECT schema_name FROM public.tenancies`) as {schema_name:string}[];
    for(const t of tenancies){
      await TenantIdentitySchema.createIfMissing(q, t.schema_name);
    }
  }
  async down(q: QueryRunner): Promise<void> {
    const tenancies = await q.query(`SELECT schema_name FROM public.tenancies`) as {schema_name:string}[];
    for(const t of tenancies){
      if(!/^tenant_[0-9a-f]{32}$/.test(t.schema_name)) continue;
      await q.query(`DROP TABLE IF EXISTS "${t.schema_name}"."obra_seguidores"`);
      await q.query(`DROP TABLE IF EXISTS "${t.schema_name}"."obra_orcamentos"`);
      await q.query(`DROP TABLE IF EXISTS "${t.schema_name}"."obra_responsaveis"`);
      await q.query(`DROP TABLE IF EXISTS "${t.schema_name}"."obras_privadas"`);
      await q.query(`DROP TABLE IF EXISTS "${t.schema_name}"."obras"`);
      await q.query(`DROP TABLE IF EXISTS "${t.schema_name}"."pessoas"`);
      await q.query(`DROP TABLE IF EXISTS "${t.schema_name}"."fontes"`);
    }
  }
}
