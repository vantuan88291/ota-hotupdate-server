import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AppEntity } from "../data/app.entity";
import { Repository } from "typeorm";
import { CreateAppInput } from "./model/app/CreateAppInput";
import { App } from "./model/app/App";
import { CreateAppPlatformInput } from "./model/app-platform/CreateAppPlatformInput";
import { AppPlatform } from "./model/app-platform/AppPlatform";
import { AppPlatformEntity } from "../data/app-platform.entity";
import { generateRandomString, hashString } from "src/common/utils/crypto.utils";
import { GetAppInput } from "./model/app/GetAppInput";


@Injectable()
export class AppManagementService {
    constructor(
        @InjectRepository(AppEntity)
        private readonly appRepository: Repository<AppEntity>,
        @InjectRepository(AppPlatformEntity)
        private readonly appPlatformRepo: Repository<AppPlatformEntity>,
    ){}


    async createApp(input: CreateAppInput): Promise<App> {
        const publicKey = generateRandomString(16);
        const privateKey = generateRandomString(32);
        const appEntity = this.appRepository.create({
            orgId: input.orgId,
            name: input.name,
            privateKey: privateKey,
            privateKeyFingerprint: this.generateKeyFingerprint(privateKey),
            publicKey: publicKey,
            publicKeyFingerprint: this.generateKeyFingerprint(publicKey),
        });
        return this.appRepository.save(appEntity);
    }

    async listApp(): Promise<App[]> {
        return this.appRepository.find({});
    }

    async getApp(input: GetAppInput): Promise<App> {
        return this.appRepository.findOne({
            where: {
                publicKeyFingerprint: input.publicKey && this.generateKeyFingerprint(input.publicKey),
                privateKeyFingerprint: input.privateKey && this.generateKeyFingerprint(input.privateKey)
            }
        });
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

    private generateKeyFingerprint(key: string): string {
        return hashString(key, 'md5');
    }

}