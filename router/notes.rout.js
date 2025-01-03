const express = require("express");
const router = express.Router(); // Change from `express()` to `express.Router()`
const multer = require("multer");
const path = require("path");

const notesController = require("../controller/notes.controller");
const authenticate = require("../middleware/authenticate");

// Middleware order correction
router.use(express.urlencoded({ extended: true }));
router.use(express.static(path.resolve(__dirname, "public")));

const uploader = multer({
  storage: multer.diskStorage({}),
  limits: { fileSize: 100000000 },
});

// Route to handle file upload
router.post(
  "/upload-file",
  uploader.single("pdf"),
  authenticate,
  notesController.uploadFile
);

router.get("/groupNotes/:groupId", authenticate, notesController.groupNotes);
router.get("/publicNotes",  notesController.getPublicNotes);
router.post(
  "/publicNotes",
  uploader.single("pdf"),
  authenticate,
  notesController.uploadPublicNotes
);

router.put(
  "/groupNotes/addLike/:notesId",
  authenticate,
  notesController.addLikeOrDislike
);
router.put(
  "/publicNotes/addLike/:notesId",
  authenticate,
  notesController.addLikeOrDislikeToPublicNotes
);

router.post(
  "/groupNotes/saveNotes/:notesId",
  authenticate,
  notesController.saveNotes
);
router.get("/savedNotes", authenticate, notesController.UserSavedNotes);
router.get("/your-notes", authenticate, notesController.userNotes);
router.get("/comment/:postId", notesController.getComments);
router.post("/comment",  notesController.postComment);

module.exports = router;
