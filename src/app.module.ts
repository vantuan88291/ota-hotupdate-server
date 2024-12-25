import { Module } from '@nestjs/common';
import { VersionManagementModules } from './modules/version-management/version-management.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    VersionManagementModules,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'), // Path to your folder
      serveRoot: '/public', // Optional: The URL prefix for the static files
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}