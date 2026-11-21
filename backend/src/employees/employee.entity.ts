import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { numericTransformer } from '../database/numeric.transformer';

@Entity({ name: 'employees' })
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'full_name', type: 'varchar', length: 120 })
  fullName!: string;

  /** Stored lower-cased; a unique index on lower(email) enforces uniqueness (see migration). */
  @Column({ type: 'varchar', length: 254 })
  email!: string;

  @Column({ name: 'job_title', type: 'varchar', length: 120 })
  jobTitle!: string;

  @Column({ type: 'varchar', length: 120 })
  department!: string;

  @Column({ name: 'country_code', type: 'char', length: 2 })
  countryCode!: string;

  /** Derived from countryCode by the service. Never accepted from the client. */
  @Column({ type: 'char', length: 3 })
  currency!: string;

  /** Annual gross salary in the local currency. */
  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: numericTransformer })
  salary!: number;

  /** ISO date (YYYY-MM-DD). */
  @Column({ name: 'hire_date', type: 'date' })
  hireDate!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
