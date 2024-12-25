import { Injectable } from '@nestjs/common';
import { fileExists, cleanFolder, copyAllFiles, copyFile, deleteFolder, readFileAsString, traverseAllFilesInFolder, traverseAllFoldersInFolder, writeBufferToFile, writeStringToFile } from 'src/common/utils/fs.utils';
import * as path from 'path';
import { uncompressZip } from 'src/common/utils/uncompress.utils';
import { v4 as uuidv4 } from 'uuid';
import { calculateFileChecksum } from 'src/common/utils/checksum.utils';
import { compressToZip } from 'src/common/utils/compress.utils';

interface CreateNewVersionInput {
	versionName: string;
	bundle: Buffer;
}

interface GetVersionUpdateInput {
	versionName: string;
	urlPrefix?: string;
}

export interface GetVersionUpdateResult {
	assetBundle?: string;
}

interface AppConfig {
	appId: string;
	latestVersion: string;
}


const DATA_FOLDER_NAME = "data";
const APP_CONFIG_FILE = "app_config.json";
const PUBLIC_FOLDER_NAME = "public";
const SAMPLE_APP_ID = "test-ota";
const TEMP_FOLDER_NAME = "temp";
const CHECKSUM_FILE = "checksum.json";
const BUNDLE_FILE_NAME = "bundle.zip";

@Injectable()
export class VersionManagementService {
	async createNewVersion(input: CreateNewVersionInput) {
		// TODO Get App ID
		// TODO Check grab the lock to handle the update
		const tempFolderPath = path.join(TEMP_FOLDER_NAME, uuidv4());
		const folderPath = path.join(TEMP_FOLDER_NAME, SAMPLE_APP_ID);
		const filePath = await writeBufferToFile(tempFolderPath, input.versionName, input.bundle)
		this.processNewVersion(input.versionName, filePath, folderPath, SAMPLE_APP_ID)
			.finally(() => {
				deleteFolder(tempFolderPath);
				deleteFolder(folderPath);
			});
		return {
			filePath
		}
	}

	async getVersionUpdate(input: GetVersionUpdateInput): Promise<GetVersionUpdateResult> {
		const latestVersion = await this.getLatestVersion(SAMPLE_APP_ID);
		if (!latestVersion || input.versionName === latestVersion) {
			return {}
		}
		const targetBundleFilePath = path.join(PUBLIC_FOLDER_NAME, SAMPLE_APP_ID, input.versionName, BUNDLE_FILE_NAME);
		const bundleExists = await fileExists(targetBundleFilePath);
		const bundlePath = bundleExists ? targetBundleFilePath : path.join(PUBLIC_FOLDER_NAME, SAMPLE_APP_ID, latestVersion, BUNDLE_FILE_NAME);
		return {
			assetBundle: `${input.urlPrefix || ""}/${bundlePath}`
		}
	}

	private async processNewVersion(versionName: string, filePath: string, folderPath: string, appId: string) {
		const unzipFolderPath = path.join(folderPath, versionName);
		try {
			await uncompressZip(filePath, unzipFolderPath);
			const checksumMap = await this.computeChecksumMap(unzipFolderPath);
			const checksumFilePath = await writeStringToFile(folderPath, CHECKSUM_FILE, JSON.stringify(Object.fromEntries(checksumMap)));
			const distFolderPath = await this.computeNewDistribution(versionName, checksumFilePath, unzipFolderPath, folderPath, appId, checksumMap);
			await this.publishNewDistribution(versionName, appId, distFolderPath);
		} finally {
			deleteFolder(unzipFolderPath);
		}
	}

	private async computeChecksumMap(folderPath: string): Promise<Map<string, string>> {
		const checkSumMap: Map<string, string> = new Map();
		const cb = async (filePath: string) => {
			const checkSum = await calculateFileChecksum(filePath);
			const relativePath = path.relative(folderPath, filePath);
			checkSumMap.set(relativePath, checkSum);
		}
		await traverseAllFilesInFolder(folderPath, cb);
		return checkSumMap;
	}


	private async computeNewDistribution(versionName: string, checksumFilePath: string, bundleFolderPath: string, appFolderPath: string, appId: string, newChecksum: Map<string, string>): Promise<string> {
		const distFolderPath = path.join(appFolderPath, "dist-" + uuidv4());
		const currentVersionFolderPath = path.join(distFolderPath, versionName);
		await copyFile(checksumFilePath, path.join(currentVersionFolderPath, path.basename(checksumFilePath)));
		const zipBundleFilePath = path.join(currentVersionFolderPath, BUNDLE_FILE_NAME);
		await compressToZip(bundleFolderPath, zipBundleFilePath);

		const cb = async (oldVersionName: string, oldVersionFolderPath: string) => {
			await this.computeNewDistributionForOldVersion(oldVersionName, oldVersionFolderPath, newChecksum, bundleFolderPath, distFolderPath);
		};
		await this.traverseOldVersions(appId, cb);
		return distFolderPath;
	}

	private async computeNewDistributionForOldVersion(
		oldVersionName: string,
		oldVersionFolderPath: string,
		newChecksum: Map<string, string>,
		newBundleFolderPath: string,
		newDistFolderPath: string,
	): Promise<void> {
		const oldVersionNewDistFolderPath = path.join(newDistFolderPath, oldVersionName);
		const oldVersionNewBundleFolderPath = path.join(oldVersionNewDistFolderPath, uuidv4());
		const oldVersionZipBundlePath = path.join(oldVersionNewDistFolderPath, BUNDLE_FILE_NAME);
		const oldChecksumPath = path.join(oldVersionFolderPath, CHECKSUM_FILE);
		const newChecksumPath = path.join(oldVersionNewDistFolderPath, CHECKSUM_FILE);

		await copyFile(oldChecksumPath, newChecksumPath)
		const oldCheckSumStr = await readFileAsString(newChecksumPath);
		const oldCheckSumJson = JSON.parse(oldCheckSumStr);
		const oldCheckSumMap: Map<string, string> = new Map(Object.entries(oldCheckSumJson));

		for (const [key, checksum] of newChecksum) {
			if (!oldCheckSumMap.has(key) || oldCheckSumMap.get(key) != checksum) {
				const assetFilePath = path.join(newBundleFolderPath, key);
				await copyFile(assetFilePath, path.join(oldVersionNewBundleFolderPath, key));
			}
		}

		await compressToZip(oldVersionNewBundleFolderPath, oldVersionZipBundlePath);
		await deleteFolder(oldVersionNewBundleFolderPath);
	}

	private async publishNewDistribution(versionName: string, appId: string, newDistFolderPath: string): Promise<void> {
		const publicDistFolderPath = path.join(PUBLIC_FOLDER_NAME, appId);
		const backUpFolderPath = path.join(PUBLIC_FOLDER_NAME, appId + "-backup");
		await copyAllFiles(publicDistFolderPath, backUpFolderPath);
		try {
			await cleanFolder(publicDistFolderPath);
			await copyAllFiles(newDistFolderPath, publicDistFolderPath);
			this.updateLatestVersion(appId, versionName);
		} catch (t) {
			copyAllFiles(backUpFolderPath, publicDistFolderPath);
			throw t;
		} finally {
			deleteFolder(backUpFolderPath);
		}
	}

	private async traverseOldVersions(appId: string, cb: (versionName: String, folderPath: string) => Promise<void>): Promise<void> {
		const oldDistFolderPath = path.join(PUBLIC_FOLDER_NAME, appId);
		await traverseAllFoldersInFolder(oldDistFolderPath, async (folderPath) => {
			const versionName = path.basename(folderPath);
			await cb(versionName, folderPath);
		});
	}

	private async getLatestVersion(appId: string): Promise<string | null> {
		const appConfig = await this.getAppConfig(appId);
		return appConfig?.latestVersion;
	}

	private async updateLatestVersion(appId: string, versionName: string): Promise<void> {
		var appConfig: AppConfig = await this.getAppConfig(appId);
		if(!appConfig) {
			await this.createAppConfig({
				appId,
				latestVersion: versionName
			});
			return;
		}
		appConfig.latestVersion = versionName;
		await this.updateAppConfig(appConfig);
	}

	private async getAppConfig(appId: string): Promise<AppConfig | null> {
		const appConfigData = await this.getAppConfigData();
		return appConfigData.get(appId);
	}

	private async createAppConfig(appConfig: AppConfig): Promise<AppConfig> {
		const appConfigData = await this.getAppConfigData();
		appConfigData.set(appConfig.appId, appConfig);
		await this.saveAppConfigData(appConfigData);
		return appConfig;
	}

	private async updateAppConfig(appConfig: AppConfig): Promise<AppConfig> {
		const appConfigData = await this.getAppConfigData();
		appConfigData.set(appConfig.appId, appConfig);
		await this.saveAppConfigData(appConfigData);
		return appConfig;
	}

	private async getAppConfigData(): Promise<Map<string, AppConfig>> {
		const appConfigFilePath = path.join(DATA_FOLDER_NAME, APP_CONFIG_FILE);
		const exists = await fileExists(appConfigFilePath);
		if(!exists) {
			return new Map();
		}
		const appConfigString = await readFileAsString(appConfigFilePath);
		return (new Map(Object.entries(JSON.parse(appConfigString) as any)));
	}

	private async saveAppConfigData(appConfigData: Map<string, AppConfig>): Promise<Map<string, AppConfig>> {
		const content = JSON.stringify(Object.fromEntries(appConfigData));
		await writeStringToFile(DATA_FOLDER_NAME, APP_CONFIG_FILE, content);
		return appConfigData;
	}

}
