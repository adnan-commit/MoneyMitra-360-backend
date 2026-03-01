import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import { deleteStatement, uploadStatement, uploadTextStatement } from "../controllers/statementController.js";


const router = express.Router();

router.post(
  "/upload",
  authMiddleware,
  upload.single("file"),
  uploadStatement
);

router.post("/upload-text", authMiddleware, uploadTextStatement);

router.delete("/:id", authMiddleware, deleteStatement);

export default router;