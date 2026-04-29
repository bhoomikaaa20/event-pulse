import express from "express";
import multer from "multer";

const router = express.Router();

const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (_, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});

const upload = multer({ storage });

router.post("/", upload.single("image"), (req, res) => {
    res.json({
        imageUrl: `http://localhost:5000/uploads/${req.file?.filename}`,
    });
});

export default router;