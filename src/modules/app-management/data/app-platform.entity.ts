import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { AppEntity } from './app.entity';

@Entity()
@Unique(["appId", "platform"])
export class AppPlatformEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  appId: string;

  @Column()
  platform: string;

  @Column({ nullable: true })
  targetVersionId?: string;

  @ManyToOne(() => AppEntity)
  @JoinColumn({ name: 'appId' })
  app: AppEntity;

}

