
export class AppDTO {
    id: string;
    orgId: string;
    name: string;
}

export class CreateAppBody {
    orgId: string;
    name: string;
}

export class AppPlatformDTO {
    id: string;
    appId: string;
    platform: string;
    targetVersionId?: string;
}

export class CreateAppPlatformBody {
    appId: string;
    platform: string;
}