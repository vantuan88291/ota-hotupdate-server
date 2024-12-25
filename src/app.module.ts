import { Module } from '@nestjs/common';
import { VersionManagementModules } from './modules/version-management/version-management.module';

@Module({
  imports: [
    VersionManagementModules
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
