import { Entity, Column, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity()
@Unique(["orgId", "name"])
@Unique(["publicKeyFingerprint"])
@Unique(["privateKeyFingerprint"])
export class AppEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orgId: string;

  @Column()
  name: string;

  @Column()
  publicKey: string;

  @Column()
  publicKeyFingerprint: string;

  @Column()
  privateKey: string;

  @Column()
  privateKeyFingerprint: string;
}