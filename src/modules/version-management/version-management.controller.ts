import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { VersionManagementService } from './version-management.service';
import { FileInterceptor } from '@nestjs/platform-express';



interface CreateNewVersionBody {
	versionName: string;
}

@Controller("versions")
export class VersionManagementController {
	constructor(private readonly versionManagementService: VersionManagementService) { }

	@Post()
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
}
