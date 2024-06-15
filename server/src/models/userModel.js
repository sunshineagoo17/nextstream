const db = require("../config/db");
const bcrypt = require("bcrypt");

exports.getProfile = (userId) => {
    return db("users").where({ id: userId }).first();
};

exports.register = async ({ email, password, username }) => {
    const hashedPassword = await bcrypt.hashPassword(password, 10);
    return db("users").insert({ email, password: hashedPassword, username });
};

exports.login = async ({ username, password }) => {
    const user = await db("users").where({ username }).first();
    if (user && await bcrypt.compare(password, user.password)) {
        return { id: user.id, email: user.email, username: user.username };
    } else {
        throw new Error("Invalid credentials");
    }
};

exports.updateProfile = ({ userId, email, password, username }) => {
    const updates = {};
    if (email) updates.email = email;
    if (password) updates.password = bcrypt.hashSync(password, 10);
    if (username) updates.username = username;
    return db("users").where({ id: userId }).update(updates);
};