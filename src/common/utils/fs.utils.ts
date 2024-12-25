import * as fs from 'fs';
import * as path from 'path';

/**
 * Ensure that a folder exists. If it doesn't, create it.
 * @param folderPath - The path to the folder to check or create.
 */
export function ensureFolderExists(folderPath: string): void {
	if (!fs.existsSync(folderPath)) {
		fs.mkdirSync(folderPath, { recursive: true });
	}
}

/**
 * Write a file to the specified directory.
 * @param folderPath - The directory to save the file in.
 * @param fileName - The name of the file to save.
 * @param fileBuffer - The buffer containing file data.
 * @returns The full path to the saved file.
 */
export async function writeBufferToFile(
	folderPath: string,
	fileName: string,
	fileBuffer: Buffer
): Promise<string> {
	ensureFolderExists(folderPath);

	const filePath = path.join(folderPath, fileName);
	await fs.promises.writeFile(filePath, fileBuffer);

	return filePath;
}

/**
 * Write a file to the specified directory.
 * @param folderPath - The directory to save the file in.
 * @param fileName - The name of the file to save.
 * @param fileContent - The buffer containing file data.
 * @param encode - The buffer encoding used.
 * @returns The full path to the saved file.
 */
export async function writeStringToFile(
	folderPath: string,
	fileName: string,
	fileContent: string,
	encode: BufferEncoding = 'utf8'
): Promise<string> {
	ensureFolderExists(folderPath);

	const filePath = path.join(folderPath, fileName);
	await fs.promises.writeFile(filePath, fileContent, encode);

	return filePath;
}


/**
 * Delete a file if it exists.
 * @param filePath - The path to the file to delete.
 */
export async function deleteFileIfExists(filePath: string): Promise<void> {
	try {
		await fs.promises.access(filePath);
		await fs.promises.unlink(filePath);
	} catch (err) {
		if (err.code !== 'ENOENT') {
			console.error(`Error deleting file: ${filePath}`, err);
			throw err;
		}
	}
}

/**
 * Clean up all files in a folder.
 * @param folderPath - The path to the folder to clean.
 */
export async function cleanFolder(folderPath: string): Promise<void> {
	try {
		const files = await fs.promises.readdir(folderPath);
		for (const file of files) {
			const filePath = path.join(folderPath, file);
			const stat = await fs.promises.stat(filePath);

			// If it's a directory, trigger the call back
			if (stat.isDirectory()) {
				await cleanFolder(filePath);
			} else {
				await deleteFileIfExists(filePath);
			}
		}
	} catch (err) {
		console.error(`Error cleaning folder: ${folderPath}`, err);
		throw err;
	}
}

/**
 * Check if a file exists.
 * @param filePath - The path to the file to check.
 * @returns A boolean indicating whether the file exists.
 */
export async function fileExists(filePath: string): Promise<boolean> {
	try {
		await fs.promises.access(filePath);
		return true;
	} catch {
		return false;
	}
}


/**
 * Deletes a folder and its contents (if any).
 * @param {string} folderPath - The path to the folder to delete.
 * @returns {Promise<void>} - Resolves if the folder is successfully deleted, rejects if an error occurs.
 */
export async function deleteFolder(folderPath: string) {
	await fs.promises.rm(folderPath, { recursive: true, force: true });
}



/**
 * Recursively traverses all files in a directory.
 * @param {string} dirPath - The directory to traverse.
 * @param {Function} callback - The callback to call with each file's full path.
 * @returns {Promise<void>}
 */
export async function traverseAllFilesInFolder(dirPath: string, callback: (filePath: string) => Promise<void>) {
	// Get the contents of the directory
	const files = await fs.promises.readdir(dirPath);

	// Iterate over the files and directories
	for (const file of files) {
		const filePath = path.join(dirPath, file);

		// Get stats of the file or directory
		const stat = await fs.promises.stat(filePath);

		// If it's a directory, recursively traverse it
		if (stat.isDirectory()) {
			await traverseAllFilesInFolder(filePath, callback);
		} else {
			// If it's a file, call the callback with the file path
			await callback(filePath);
		}
	}
}

/**
 * Recursively traverses all files in a directory.
 * @param {string} dirPath - The directory to traverse.
 * @param {Function} callback - The callback to call with each file's full path.
 * @returns {Promise<void>}
 */
export async function traverseAllFoldersInFolder(dirPath: string, callback: (folderPath: string) => Promise<void>) {
	if(!fs.existsSync(dirPath)) {
		return;
	}
	
	// Get the contents of the directory
	const files = await fs.promises.readdir(dirPath);

	// Iterate over the files and directories
	for (const file of files) {
		const filePath = path.join(dirPath, file);

		// Get stats of the file or directory
		const stat = await fs.promises.stat(filePath);

		// If it's a directory, trigger the call back
		if (stat.isDirectory()) {
			await callback(filePath);
		}
	}
}

/**
 * Copies a single file from one folder to another.
 * @param {string} source - The path to the source file.
 * @param {string} destination - The path to the destination folder.
 * @returns {Promise<void>} - Resolves when the file is successfully copied.
 */
export async function copyFile(source: string, destination: string): Promise<void> {
	// Ensure the destination folder exists
	await fs.promises.mkdir(path.dirname(destination), { recursive: true });
	// Copy the file
	await fs.promises.copyFile(source, destination);
}

/**
 * Copies all files from one folder to another.
 * @param {string} sourceFolder - The path to the source folder.
 * @param {string} destinationFolder - The path to the destination folder.
 * @returns {Promise<void>} - Resolves when all files are successfully copied.
 */
export async function copyAllFiles(sourceFolder: string, destinationFolder: string): Promise<void> {
	await ensureFolderExists(sourceFolder);
	await ensureFolderExists(destinationFolder);
    // Read all files and folders in the source folder
	const items = await fs.promises.readdir(sourceFolder, { withFileTypes: true });

	for (const item of items) {
		const sourcePath = path.join(sourceFolder, item.name);
		const destinationPath = path.join(destinationFolder, item.name);

		if (item.isFile()) {
			// Copy the file
			await copyFile(sourcePath, destinationPath);
		} else if (item.isDirectory()) {
			// Recursively copy the contents of the directory
			await copyAllFiles(sourcePath, destinationPath);
		}
	}
}

/**
 * Reads a file and returns its content as a string.
 * @param {string} filePath - The path to the file.
 * @returns {Promise<string>} - The file content as a string.
 */
export async function readFileAsString(filePath: string, encoding: BufferEncoding = 'utf8'): Promise<string> {
	const fileContent = await fs.promises.readFile(filePath, encoding);
	return fileContent;
}