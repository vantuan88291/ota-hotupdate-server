import { Module } from "@nestjs/common";
import { VersionManagementService } from "./service/version-management.service";
import { VersionManagementController } from "./controller/version-management.controller";
import { AppManagementModule } from "../app-management/app-management.module";

@Module({
  imports: [AppManagementModule],
  controllers: [VersionManagementController],
  providers: [VersionManagementService],
})
export class VersionManagementModule {}
