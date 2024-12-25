import { Injectable } from '@nestjs/common';
import { cleanFolder, copyAllFiles, copyFile, deleteFolder, readFileAsString, traverseAllFilesInFolder, traverseAllFoldersInFolder, writeBufferToFile, writeStringToFile } from 'src/common/utils/fs.utils';
import * as path from 'path';
import { uncompressZip } from 'src/common/utils/uncompress.utils';
import { v4 as uuidv4 } from 'uuid';
import { calculateFileChecksum } from 'src/common/utils/checksum.utils';
import { compressToZip } from 'src/common/utils/compress.utils';

interface CreateNewVersionInput {
	versionName: string;
	bundle: Buffer;
}

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
		// Step 2: compute for older versions
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
	const oldCheckSumStr =  await readFileAsString(newChecksumPath);
	const oldCheckSumJson = JSON.parse(oldCheckSumStr);
	const oldCheckSumMap: Map<string, string> = new Map(Object.entries(oldCheckSumJson));

	for(const [key, checksum] of newChecksum) {
		if(!oldCheckSumMap.has(key) || oldCheckSumMap.get(key) != checksum) {
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
		} catch(t) {
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
}
