import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AppEntity } from "../data/app.entity";
import { Repository } from "typeorm";
import { CreateAppInput } from "./model/app/CreateAppInput";
import { App } from "./model/app/App";
import { CreateAppPlatformInput } from "./model/app-platform/CreateAppPlatformInput";
import { AppPlatform } from "./model/app-platform/AppPlatform";
import { AppPlatformEntity } from "../data/app-platform.entity";


@Injectable()
export class AppManagementService {
    constructor(
        @InjectRepository(AppEntity)
        private readonly appRepository: Repository<AppEntity>,
        @InjectRepository(AppPlatformEntity)
        private readonly appPlatformRepo: Repository<AppPlatformEntity>,
    ){}


    async createApp(input: CreateAppInput): Promise<App> {
        const appEntity = this.appRepository.create({
            orgId: input.orgId,
            name: input.name
        });
        return this.appRepository.save(appEntity);
    }

    async listApp(): Promise<App[]> {
        return this.appRepository.find({});
    }

    async createAppPlatform(input: CreateAppPlatformInput): Promise<AppPlatform> {
        const appPlatformEntity = this.appPlatformRepo.create({
            appId: input.appId,
            platform: input.platform
        });
        return this.appPlatformRepo.save(appPlatformEntity);
    }

    async listAppPlatform(): Promise<AppPlatform[]> {
        return this.appPlatformRepo.find({});
    }

}