import { Module } from '@nestjs/common';
import { VersionManagementModule } from './modules/version-management/version-management.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppManagementModule } from './modules/app-management/app-management.module';
import { AppEntity } from './modules/app-management/data/app.entity';
import { AppPlatformEntity } from './modules/app-management/data/app-platform.entity';

@Module({
  imports: [
    VersionManagementModule,
    AppManagementModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/public',
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',           // Specify SQLite as the database type
      database: 'database.sqlite', // Database file (SQLite database will be created here)
      entities: [AppEntity, AppPlatformEntity],   // List of entities
      synchronize: true,        // Automatically synchronize the database schema (disable in production)
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}