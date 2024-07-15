import { Router } from 'express';
import UserService from '../services/UserService.js';
import NumberMiddleware from '../middlewares/number.middleware.js';
import UserMiddleware from '../middlewares/user.middleware.js';
import AuthMiddleware from '../middlewares/auth.middleware.js';

const router = Router();

const handleResponse = (res, response) => {
    res.status(response.code).json(response.message);
};

const createUser = async (req, res, next) => {
    try {
        const response = await UserService.createUser(req);
        handleResponse(res, response);
    } catch (error) {
        next(error);
    }
};

const getAllUsers = async (req, res, next) => {
    try {
        const response = await UserService.getAllUsers(req);
        handleResponse(res, response);
    } catch (error) {
        next(error);
    }
};

const bulkCreateUsers = async (req, res, next) => {
    try {
        const response = await UserService.bulkCreateUsers(req.body.users);
        handleResponse(res, response);
    } catch (error) {
        next(error);
    }
};

const findUsers = async (req, res, next) => {
    try {
        const response = await UserService.findUsers(req.query);
        handleResponse(res, response);
    } catch (error) {
        next(error);
    }
};

const getUserById = async (req, res, next) => {
    try {
        const response = await UserService.getUserById(req.params.id);
        handleResponse(res, response);
    } catch (error) {
        next(error);
    }
};

const updateUser = async (req, res, next) => {
    try {
        const response = await UserService.updateUser(req);
        handleResponse(res, response);
    } catch (error) {
        next(error);
    }
};

const deleteUser = async (req, res, next) => {
    try {
        const response = await UserService.deleteUser(req.params.id);
        handleResponse(res, response);
    } catch (error) {
        next(error);
    }
};

router.post('/create', createUser);
router.get('/getAllUsers', getAllUsers);
router.post('/bulkCreate', bulkCreateUsers);
router.get('/findUsers', findUsers);

router.get(
    '/:id',
    [
        NumberMiddleware.isNumber,
        UserMiddleware.isValidUserById,
        AuthMiddleware.validateToken,
        UserMiddleware.hasPermissions
    ],
    getUserById
);

router.put(
    '/:id',
    [
        NumberMiddleware.isNumber,
        UserMiddleware.isValidUserById,
        AuthMiddleware.validateToken,
        UserMiddleware.hasPermissions
    ],
    updateUser
);

router.delete(
    '/:id',
    [
        NumberMiddleware.isNumber,
        UserMiddleware.isValidUserById,
        AuthMiddleware.validateToken,
        UserMiddleware.hasPermissions
    ],
    deleteUser
);

export default router;