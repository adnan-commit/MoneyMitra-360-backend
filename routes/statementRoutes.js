import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import { uploadStatement, uploadTextStatement } from "../controllers/statementController.js";


const router = express.Router();

router.post(
  "/upload",
  authMiddleware,
  upload.single("statement"),
  uploadStatement
);

router.post("/upload-text", authMiddleware, uploadTextStatement);

export default router;