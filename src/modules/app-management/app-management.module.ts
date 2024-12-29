import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppEntity } from "./data/app.entity";
import { AppPlatformEntity } from "./data/app-platform.entity";
import { AppManagementService } from "./service/app-management.service";
import { AppManagementController } from "./controller/app-management.controller";

@Module({
  imports: [TypeOrmModule.forFeature([AppEntity, AppPlatformEntity])],
  controllers: [AppManagementController],
  providers: [AppManagementService],
  exports: [AppManagementService]
})
export class AppManagementModule {}