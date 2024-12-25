import { Body, Controller, Get, Post, Query, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { VersionManagementService } from './version-management.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';

interface CreateNewVersionBody {
	versionName: string;
}

@Controller()
export class VersionManagementController {
	constructor(private readonly versionManagementService: VersionManagementService) { }

	@Post("versions")
	@UseInterceptors(FileInterceptor('bundle'))
	createNewVersion(
		@Body() body: CreateNewVersionBody,
		@UploadedFile() bundle: Express.Multer.File
	) {
		return this.versionManagementService.createNewVersion({
			versionName: body.versionName,
			bundle: bundle.buffer
		});
	}

	@Get("version/update")
	getVersionUpdate(
		@Query() query: { version: string },
		@Req() req: Request
	) {
		const protocol = req.protocol;
		const host = req.get('host');
		const urlPrefix = `${protocol}://${host}`;
		return this.versionManagementService.getVersionUpdate({
			versionName: query.version,
			urlPrefix
		})
	}
}
