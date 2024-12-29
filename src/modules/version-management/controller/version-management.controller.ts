import { Body, Controller, Get, Post, Query, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { ApiBody, ApiConsumes, ApiProperty, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { VersionManagementService } from '../service/version-management.service';

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
	constructor(private readonly versionManagementService: VersionManagementService) { }

	@Post("versions")
	@ApiResponse({status: 200, type: CreateNewVersionDTO})
	@ApiConsumes('multipart/form-data')
	@ApiBody({type: CreateNewVersionBody})
	@UseInterceptors(FileInterceptor('bundle'))
	createNewVersion(
		@Body() body: CreateNewVersionBody,
		@UploadedFile() bundle: Express.Multer.File
	): Promise<CreateNewVersionDTO> {
		return this.versionManagementService.createNewVersion({
			versionName: body.versionName,
			bundle: bundle.buffer
		}).then(() => ({}));
	}

	@Get("version/update")
	@ApiQuery({ name: 'version', description: 'Version of the app' })
	@ApiResponse({status: 200, type: GetVersionUpdateDTO})
	getVersionUpdate(
		@Query() query: { version: string },
		@Req() req: Request
	): Promise<GetVersionUpdateDTO> {
		const protocol = req.protocol;
		const host = req.get('host');
		const urlPrefix = `${protocol}://${host}`;
		return this.versionManagementService.getVersionUpdate({
			versionName: query.version,
			urlPrefix
		})
	}
}
