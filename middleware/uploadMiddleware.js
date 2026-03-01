import multer from "multer";

// Store file in memory (secure for hackathon)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Allowed MIME types
  const allowedMimeTypes = [
    "application/pdf",                                      // .pdf
    "text/csv",                                             // .csv
    "application/vnd.ms-excel",                             // .xls (Old Excel)
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" // .xlsx (New Excel/Paytm)
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, CSV, and Excel (.xlsx, .xls) files are allowed"), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter,
});

export default upload;