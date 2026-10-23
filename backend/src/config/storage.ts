import path from 'path';
import fs from 'fs';

export const ROOT_DIR = path.resolve(__dirname, '../../../');
export const STORAGE_DIR = path.resolve(ROOT_DIR, 'storage');
export const UPLOADS_DIR = path.resolve(STORAGE_DIR, 'uploads');
export const STEMS_DIR = path.resolve(STORAGE_DIR, 'stems');
export const WORKER_DIR = path.resolve(ROOT_DIR, 'worker');

// Ensure necessary directories exist
[STORAGE_DIR, UPLOADS_DIR, STEMS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});
