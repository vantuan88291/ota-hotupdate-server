import { Module } from "@nestjs/common";
import { VersionManagementService } from "./version-management.service";
import { VersionManagementController } from "./version-management.controller";

@Module({
  imports: [],
  controllers: [VersionManagementController],
  providers: [VersionManagementService],
})
export class VersionManagementModules {}
