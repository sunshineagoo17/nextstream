const userModel = require("../models/userModel");

exports.getProfile = async (req, res) => {
    const { userId } = req.query;
    try {
        const profile = await userModel.getProfile(userId);
        res.json(profile);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.register = async (req, res) => {
    const { email, password, username } = req.body;
    try {
        const newUser = await userModel.register({ email, password, username });
        res.json(newUser);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await userModel.login({ username, password });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.updateProfile = async (req, res) => {
    const { userId, email, password, username } = req.body;
    try {
        await userModel.updateProfile({ userId, email, password, username });
        res.json({ message: "Profile updated successfully" });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};