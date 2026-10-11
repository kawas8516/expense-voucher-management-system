import multer from "multer";

// keep file in memory, it is saved to the files table (see utils/files.js)
const storage = multer.memoryStorage();

// only allow images for signature
function fileFilter(req, file, cb) {
  if (["image/png", "image/jpeg", "image/jpg"].includes(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new Error("Only png / jpg images allowed");
    err.status = 400;
    cb(err);
  }
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 2 * 1024 * 1024 } });

export default upload;
