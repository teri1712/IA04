import multer from "multer";
import path from "path";

const __dirname = path.resolve();
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, storage + "/public/avatar/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });
export default upload;
