import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmployees1763700000000 implements MigrationInterface {
  name = 'CreateEmployees1763700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // gen_random_uuid() is built in from PostgreSQL 13, so no extension is needed.
    await queryRunner.query(`
      CREATE TABLE employees (
        id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name    varchar(120)  NOT NULL,
        email        varchar(254)  NOT NULL,
        job_title    varchar(120)  NOT NULL,
        department   varchar(120)  NOT NULL,
        country_code char(2)       NOT NULL,
        currency     char(3)       NOT NULL,
        salary       numeric(12,2) NOT NULL CONSTRAINT employees_salary_positive CHECK (salary > 0),
        hire_date    date          NOT NULL,
        created_at   timestamptz   NOT NULL DEFAULT now(),
        updated_at   timestamptz   NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX uq_employees_email_lower ON employees (lower(email))`);
    await queryRunner.query(`CREATE INDEX idx_employees_country ON employees (country_code)`);
    await queryRunner.query(`CREATE INDEX idx_employees_department ON employees (department)`);
    await queryRunner.query(`CREATE INDEX idx_employees_country_job_title ON employees (country_code, job_title)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE employees`);
  }
}
