import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, "sign_" + Date.now() + "_" + Math.round(Math.random() * 1000) + ext);
  },
});

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
