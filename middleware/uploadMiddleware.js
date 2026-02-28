import multer from "multer";

// Store file in memory (secure for hackathon)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf" || file.mimetype === "text/csv") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF and CSV files are allowed"), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter,
});

export default upload;
