import * as fs from 'fs';
import * as unzipper from 'unzipper';

/**
 * Uncompresses a ZIP file into a specified directory.
 * @param {string} inputPath - The path to the ZIP file to extract.
 * @param {string} outputDir - The directory where the extracted files will be saved.
 * @returns {Promise<string>} - A message indicating the result.
 */
export const uncompressZip = (inputPath, outputDir) => {
  return new Promise((resolve, reject) => {
    fs.createReadStream(inputPath)
      .pipe(unzipper.Extract({ path: outputDir }))
      .on('close', () => resolve(`ZIP file extracted to: ${outputDir}`))
      .on('error', (err) => reject(err));
  });
};
