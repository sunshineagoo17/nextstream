const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.get("/profile", userController.getProfile);
router.post("/register", userController.register);
router.post("/login", userController.login);
router.put("/profile", userController.updateProfile);

module.exports = router;