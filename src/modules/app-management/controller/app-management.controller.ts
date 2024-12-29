import { Body, Controller, Get, Post } from "@nestjs/common";
import { AppManagementService } from "../service/app-management.service";
import { AppDTO, AppPlatformDTO, CreateAppBody, CreateAppPlatformBody } from "./model/types";

@Controller()
export class AppManagementController {
    constructor(private readonly appManagementService: AppManagementService) { }

    @Post("apps")
    async createApp(
        @Body() body: CreateAppBody 
    ): Promise<AppDTO> {
        return this.appManagementService.createApp(body);
    }

    @Get("apps")
    async listApp(): Promise<AppDTO[]> {
        return this.appManagementService.listApp();
    }


    @Post("app/platforms")
    async createAppPlatform(
        @Body() body: CreateAppPlatformBody 
    ): Promise<AppPlatformDTO> {
        return this.appManagementService.createAppPlatform(body);
    }

    @Get("app/platforms")
    async listAppPlatform(): Promise<AppPlatformDTO[]> {
        return this.appManagementService.listAppPlatform();
    }
}