import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIdentityFoundation1781200000000
  implements MigrationInterface
{
  name = 'CreateIdentityFoundation1781200000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "public"."tenancies" (
        "id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "slug" character varying NOT NULL,
        "cnpj" character varying,
        "active" boolean NOT NULL DEFAULT true,
        "schema_name" character varying NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tenancies" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_tenancies_slug" UNIQUE ("slug"),
        CONSTRAINT "UQ_tenancies_schema_name" UNIQUE ("schema_name")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "public"."users" (
        "id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "role" character varying NOT NULL,
        "tenant_id" uuid,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "FK_users_tenancies" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenancies"("id"),
        CONSTRAINT "CHK_users_role_tenant" CHECK (
          ("role" = 'SUPERADMIN' AND "tenant_id" IS NULL)
          OR ("role" IN ('ADMIN', 'STAFF', 'USER') AND "tenant_id" IS NOT NULL)
        )
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_users_tenant_email" ON "public"."users" ("tenant_id", "email")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_users_platform_email" ON "public"."users" ("email") WHERE "tenant_id" IS NULL`,
    );
    await queryRunner.query(`
      CREATE TABLE "public"."user_sessions" (
        "id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "refresh_token_hash" character varying NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "revoked_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_sessions_users" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "public"."user_sessions"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_users_platform_email"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_users_tenant_email"`);
    await queryRunner.query(`DROP TABLE "public"."users"`);
    await queryRunner.query(`DROP TABLE "public"."tenancies"`);
  }
}
