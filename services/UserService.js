import db from '../dist/db/models/index.js';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';

const createUser = async (req) => {
    const { name, email, password, password_second, cellphone } = req.body;
    if (password !== password_second) {
        return { code: 400, message: 'Passwords do not match' };
    }

    const user = await db.User.findOne({ where: { email } });
    if (user) {
        return { code: 400, message: 'User already exists' };
    }

    const encryptedPassword = await bcrypt.hash(password, 10);
    const newUser = await db.User.create({
        name,
        email,
        password: encryptedPassword,
        cellphone,
        status: true
    });

    return { code: 200, message: `User created successfully with ID: ${newUser.id}` };
};

const getAllUsers = async () => {
    try {
        const users = await db.User.findAll({ where: { status: true } });
        return { code: 200, message: users };
    } catch (error) {
        return { code: 500, message: error.message };
    }
};

const getUserById = async (id) => {
    try {
        const user = await db.User.findOne({ where: { id, status: true } });
        if (!user) return { code: 404, message: 'User not found' };
        return { code: 200, message: user };
    } catch (error) {
        return { code: 500, message: error.message };
    }
};

const updateUser = async (req) => {
    try {
        const user = await db.User.findOne({ where: { id: req.params.id, status: true } });
        if (!user) return { code: 404, message: 'User not found' };

        const payload = {
            name: req.body.name ?? user.name,
            password: req.body.password ? await bcrypt.hash(req.body.password, 10) : user.password,
            cellphone: req.body.cellphone ?? user.cellphone
        };

        await db.User.update(payload, { where: { id: req.params.id } });
        return { code: 200, message: 'User updated successfully' };
    } catch (error) {
        return { code: 500, message: error.message };
    }
};

const deleteUser = async (id) => {
    try {
        const user = await db.User.findOne({ where: { id, status: true } });
        if (!user) return { code: 404, message: 'User not found' };

        await db.User.update({ status: false }, { where: { id } });
        return { code: 200, message: 'User deleted successfully' };
    } catch (error) {
        return { code: 500, message: error.message };
    }
};

const findUsers = async (query) => {
    const { deleted, name, loginBefore, loginAfter } = query;
    const whereClause = {};

    if (deleted !== undefined) whereClause.status = deleted !== 'true';
    if (name) whereClause.name = { [Op.like]: `%${name}%` };
    if (loginBefore) whereClause.lastLogin = { [Op.lt]: new Date(loginBefore) };
    if (loginAfter) whereClause.lastLogin = { [Op.gt]: new Date(loginAfter) };

    try {
        const users = await db.User.findAll({ where: whereClause });
        return { code: 200, message: users };
    } catch (error) {
        return { code: 500, message: error.message };
    }
};

const bulkCreateUsers = async (users) => {
    const results = { successful: 0, failed: 0 };

    for (const user of users) {
        const { name, email, password, password_second, cellphone } = user;
        if (!name || !email || !password || password !== password_second) {
            results.failed++;
            continue;
        }

        const existingUser = await db.User.findOne({ where: { email } });
        if (existingUser) {
            results.failed++;
            continue;
        }

        const encryptedPassword = await bcrypt.hash(password, 10);
        await db.User.create({
            name,
            email,
            password: encryptedPassword,
            cellphone,
            status: true
        });

        results.successful++;
    }

    return { code: 200, message: results };
};

const find = async (req) => {
    const parametrosEncontrados = {};
    const filterUsers = [];
    const usersdb = await db.User.findAll({});
    const sessionFilter = await db.Session.findAll({});

    if (req.status) {
        parametrosEncontrados.status = req.status.toLowerCase();
    }

    const fechaB = req.logBefore ? new Date(req.logBefore) : null;
    const fechaA = req.logAfter ? new Date(req.logAfter) : null;

    const logB = sessionFilter
        .filter(session => fechaB && fechaB.getTime() > session.createdAt.getTime())
        .map(session => session.id_user);

    const logA = sessionFilter
        .filter(session => fechaA && fechaA.getTime() < session.createdAt.getTime())
        .map(session => session.id_user);

    const logBSet = new Set(logB);
    const logASet = new Set(logA);

    let usercount = 0;
    usersdb.forEach(user => {
        let i = 0;
        let j = 0;
        usercount++;

        Object.entries(parametrosEncontrados).forEach(([key, value]) => {
            j++;
            if (user[key] !== undefined && String(user[key]).includes(String(value))) {
                i++;
            }
        });

        if (req.logBefore) {
            j++;
            if (logBSet.has(user.id)) {
                i++;
            }
        }

        if (req.logAfter) {
            j++;
            if (logASet.has(user.id)) {
                i++;
            }
        }

        if (i === j) filterUsers.push(user);
    });

    return { code: 200, message: filterUsers };
};

export default {
    createUser,
    getUserById,
    updateUser,
    deleteUser,
    getAllUsers,
    findUsers,
    bulkCreateUsers,
    find
};