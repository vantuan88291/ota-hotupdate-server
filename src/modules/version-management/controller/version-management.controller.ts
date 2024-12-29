import { Body, Controller, Get, Post, Query, Req, UploadedFile, UseInterceptors, Headers } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { ApiBody, ApiConsumes, ApiProperty, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { VersionManagementService } from '../service/version-management.service';
import { AppManagementService } from 'src/modules/app-management/service/app-management.service';

class CreateNewVersionBody {
	@ApiProperty({ description: "New Version"})
	versionName: string;

	@ApiProperty({
		description: 'Compressed bundle',
		type: 'string',
		format: 'binary',
	})
	bundle: any;
}

class CreateNewVersionDTO {
}

class GetVersionUpdateDTO {
	@ApiProperty({ description: "Link to fetch the asset bundle" })
	assetBundle?: string;
}

@Controller()
export class VersionManagementController {
	constructor(
		private readonly versionManagementService: VersionManagementService,
		private readonly appManagementService: AppManagementService
	) { }

	@Post("versions")
	@ApiResponse({status: 200, type: CreateNewVersionDTO})
	@ApiConsumes('multipart/form-data')
	@ApiBody({type: CreateNewVersionBody})
	@UseInterceptors(FileInterceptor('bundle'))
	async createNewVersion(
		@Body() body: CreateNewVersionBody,
		@UploadedFile() bundle: Express.Multer.File,
		@Headers("X-PRIVATE-KEY") privateKey: string
	): Promise<CreateNewVersionDTO> {
		const app = await this.appManagementService.getApp({privateKey});
		return this.versionManagementService.createNewVersion({
			appId: app.id,
			versionName: body.versionName,
			bundle: bundle.buffer
		}).then(() => ({}));
	}

	@Get("version/update")
	@ApiQuery({ name: 'version', description: 'Version of the app' })
	@ApiResponse({status: 200, type: GetVersionUpdateDTO})
	async getVersionUpdate(
		@Query() query: { version: string },
		@Req() req: Request,
		@Headers("X-PUBLIC-KEY") publicKey: string
	): Promise<GetVersionUpdateDTO> {
		const protocol = req.protocol;
		const host = req.get('host');
		const urlPrefix = `${protocol}://${host}`;
		const app = await this.appManagementService.getApp({publicKey});
		return this.versionManagementService.getVersionUpdate({
			appId: app.id,
			versionName: query.version,
			urlPrefix
		})
	}
}
