import * as fs from 'fs';
import * as archiver from 'archiver';

/**
 * Compresses a directory or file into a ZIP file.
 * @param {string} inputPath - The path to the file or directory to compress.
 * @param {string} outputPath - The path where the output ZIP file will be saved.
 * @returns {Promise<string>} - A message indicating the result.
 */
export const compressToZip = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve(`ZIP file created: ${outputPath}`));
    archive.on('error', (err) => reject(err));

    archive.pipe(output);
    archive.directory(inputPath, false); // Compress the directory and preserve structure
    archive.finalize();
  });
};