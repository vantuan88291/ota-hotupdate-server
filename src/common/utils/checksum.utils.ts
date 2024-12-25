import * as fs from 'fs';
import * as crypto from 'crypto';

/**
 * Calculates the checksum of a file using the specified algorithm.
 * @param {string} filePath - The path to the file.
 * @param {string} algorithm - The hash algorithm (e.g., 'md5', 'sha256', etc.).
 * @returns {Promise<string>} - The checksum of the file as a hex string.
 */
export async function calculateFileChecksum(
  filePath: string,
  algorithm: string = 'sha256'
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Create a read stream for the file
      const fileStream = fs.createReadStream(filePath);

      // Create a hash object using the specified algorithm
      const hash = crypto.createHash(algorithm);

      // Pipe the file's data into the hash
      fileStream.on('data', (chunk) => {
        hash.update(chunk);
      });

      // Resolve the promise with the calculated checksum
      fileStream.on('end', () => {
        resolve(hash.digest('hex')); // Return the checksum as a hex string
      });

      // Handle errors
      fileStream.on('error', (err) => {
        reject(`Error reading the file: ${err.message}`);
      });
    } catch (err) {
      reject(`Error calculating checksum: ${err}`);
    }
  });
}
