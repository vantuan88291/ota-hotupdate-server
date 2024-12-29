import { Module } from "@nestjs/common";
import { VersionManagementService } from "./service/version-management.service";
import { VersionManagementController } from "./controller/version-management.controller";

@Module({
  imports: [],
  controllers: [VersionManagementController],
  providers: [VersionManagementService],
})
export class VersionManagementModule {}
