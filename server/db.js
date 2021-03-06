const spicedPg = require("spiced-pg");
const dbUsername = "postgres";
const dbUserPassword = "postgres";
const database = "socialnetwork";

const db = spicedPg(
    process.env.DATABASE_URL ||
        `postgres:${dbUsername}:${dbUserPassword}@localhost:5432/${database}`
);

console.log("[db] connecting to:", database);

module.exports.addUser = (userFirst, userLast, userEmail, userPassword) => {
    const q = `INSERT INTO users (first, last, email, password)
               VALUES($1, $2, $3, $4)
               RETURNING id`;
    const params = [userFirst, userLast, userEmail, userPassword];
    return db.query(q, params);
};

module.exports.getUserByEmail = (userEmail) => {
    const q = `SELECT password, id FROM users 
               WHERE email = $1`;
    const params = [userEmail];
    return db.query(q, params);
};

module.exports.getUserById = (userId) => {
    const q = `SELECT picture_url, first, last, bio FROM users 
               WHERE id = $1`;
    const params = [userId];
    return db.query(q, params);
};

module.exports.checkForUser = (userEmail) => {
    const q = `SELECT COUNT(1) 
               FROM users 
               WHERE email = $1`;
    const params = [userEmail];
    return db.query(q, params);
};

module.exports.storeCode = (userEmail, code) => {
    const q = `INSERT INTO reset (email, code)
               VALUES($1, $2)
               ON CONFLICT (email) DO UPDATE 
               SET code = $2`;
    const params = [userEmail, code];
    return db.query(q, params);
};

module.exports.getCode = (code, email) => {
    const q = `SELECT * FROM reset
               WHERE code = $1
               AND email = $2
               AND CURRENT_TIMESTAMP - created_at < INTERVAL '10 minutes'`;
    const params = [code, email];
    return db.query(q, params);
};

module.exports.setNewPassword = (password, email) => {
    const q = `UPDATE users
               SET password = $1
               WHERE email = $2`;
    const params = [password, email];
    return db.query(q, params);
};

module.exports.addProfilePic = ({ url, userId }) => {
    const q = `UPDATE users 
               SET picture_url = $1
               WHERE id = $2
               RETURNING picture_url`;
    const params = [url, userId];
    return db.query(q, params);
};

module.exports.addBio = ({ bio, userId }) => {
    const q = `UPDATE users 
               SET bio = $1
               WHERE id = $2`;
    const params = [bio, userId];
    return db.query(q, params);
};

module.exports.getUsersBySearch = (search, userId) => {
    const q = `SELECT id, picture_url, first, last
               FROM users
               WHERE id != $2
               AND (first ILIKE $1
               OR last ILIKE $1 
               OR CONCAT (first, ' ', last) ILIKE $1)                
               ORDER BY id DESC
               LIMIT 3`;
    const params = [`${search}%`, userId];
    return db.query(q, params);
};

module.exports.getNewUsers = () => {
    const q = `SELECT id, picture_url, first, last
               FROM users
               ORDER BY id DESC
               LIMIT 3`;
    return db.query(q);
};

module.exports.friendshipStatus = ({ ownId, otherId }) => {
    const q = `SELECT * FROM friendships
               WHERE (recipient_id = $1 AND sender_id = $2)
               OR (recipient_id = $2 AND sender_id = $1)`;
    const params = [ownId, otherId];
    return db.query(q, params);
};

module.exports.sendFriendRequest = ({ ownId, otherId }) => {
    const q = `INSERT INTO friendships (sender_id, recipient_id)
               VALUES ($1, $2)`;
    const params = [ownId, otherId];
    return db.query(q, params);
};

module.exports.acceptFriendRequest = ({ ownId, otherId }) => {
    const q = `UPDATE friendships
               SET accepted = true                 
               WHERE (recipient_id = $1 AND sender_id = $2)`;
    const params = [ownId, otherId];
    return db.query(q, params);
};

module.exports.cancelFriendRequest = ({ ownId, otherId }) => {
    const q = `DELETE FROM friendships                 
               WHERE (recipient_id = $1 AND sender_id = $2)
               OR (recipient_id = $2 AND sender_id = $1)`;
    const params = [ownId, otherId];
    return db.query(q, params);
};
