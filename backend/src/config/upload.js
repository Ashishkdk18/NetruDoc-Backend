import multer from 'multer';
import path from 'path';
import fs from 'fs';

const DEFAULT_REPORTS_PATH = path.join(process.cwd(), 'uploads', 'reports');

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const reportsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.REPORTS_UPLOAD_PATH || DEFAULT_REPORTS_PATH;
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `report-${uniqueSuffix}${ext}`);
  }
});

const allowedMimeTypes = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp'
];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and image files are allowed'));
  }
};

export const reportsUpload = multer({
  storage: reportsStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

