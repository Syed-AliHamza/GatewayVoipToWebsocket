import Joi from 'joi';
import passport from 'passport';
import _ from 'lodash';
import express from 'express';
import models from '../../models';
import uploadFile from '../../middlewares/upload';
import { PAGE_SIZE, STATUS_CODES } from '../../utils/constants';
import { BadRequest } from '../../error';
import { getUserByIdQuery, listQuery } from './query';

import {
  BadRequestError,
  cleanUnusedImages,
  generateHash,
  generateJWT,
  getErrorMessages,
  getPassportErrorMessage,
  SuccessResponse,
} from '../../utils/helper';
import { userLoginSchema, userSignUpSchema, userUpdateSchema } from './validationSchemas';

const { User } = models;
class UserController {
  static router;

  static getRouter() {
    this.router = express.Router();
    this.router.get('/', this.list);
    this.router.post('/', uploadFile('image').single('file'), this.createUser);
    this.router.put('/:id', uploadFile('image').single('file'), this.updateUser);
    this.router.get('/:id', this.getUserById);
    this.router.post('/login', this.login);
    this.router.delete('/deleteUsers', this.deleteUsers);
    return this.router;
  }

  static async list(req, res, next) {
    const {
      query: {
        status,
        searchString,
        name,
        departmentId,
        title,
        extension,
        locationId,
        sortColumn,
        sortOrder,
        pageNumber = 1,
        pageSize = PAGE_SIZE,
      },
    } = req;
    try {
      if (pageNumber <= 0) {
        BadRequestError('Invalid page number', STATUS_CODES.INVALID_INPUT);
      }

      const query = listQuery({
        status,
        searchString,
        name,
        departmentId,
        title,
        extension,
        locationId,
        sortColumn,
        sortOrder,
        pageNumber,
        pageSize,
      });
      const users = await User.findAndCountAll(query);
      return SuccessResponse(res, users);
    } catch (e) {
      next(e);
    }
  }

  static async getUserById(req, res, next) {
    const {
      params: { id },
    } = req;

    try {
      if (!id) {
        BadRequestError(`User id is required`, STATUS_CODES.INVALID_INPUT);
      }
      const query = getUserByIdQuery({ id });
      const user = await User.findOne(query);
      UserController.generatePreSignedUrl([user]);
      return SuccessResponse(res, user);
    } catch (e) {
      next(e);
    }
  }

  static async login(req, res, next) {
    const { body: user } = req;

    const result = Joi.validate(user, userLoginSchema, { abortEarly: true });
    if (result.error) {
      return next(new BadRequest(getErrorMessages(result), STATUS_CODES.INVALID_INPUT));
    }

    return passport.authenticate('local', { session: false }, (err, passportUser, info) => {
      if (err) {
        return next(err);
      }

      if (passportUser) {
        const userObj = {
          id: passportUser.id,
          email: passportUser.email,
          role: passportUser.role,
          username: passportUser.username,
          avatar: passportUser.avatar,
          token: generateJWT(passportUser),
        };
        UserController.generatePreSignedUrl([userObj]);
        return SuccessResponse(res, userObj);
      }
      return next(new BadRequest(getPassportErrorMessage(info), STATUS_CODES.INVALID_INPUT));
    })(req, res, next);
  }

  static async createUser(req, res, next) {
    const { body: userPayload, file = {} } = req;
    try {
      const result = Joi.validate(userPayload, userSignUpSchema);
      if (result.error) {
        BadRequestError(getErrorMessages(result), STATUS_CODES.INVALID_INPUT);
      }
      const query = {
        where: {
          email: userPayload.email,
        },
      };

      const userExists = await User.findOne(query);
      if (!userExists) {
        userPayload.password = generateHash(userPayload.password);
        userPayload.role = userPayload.role || 'user';
        userPayload.avatar = file.key;
        const user = await User.create(userPayload);
        const userResponse = user.toJSON();
        delete userResponse.password;
        return SuccessResponse(res, userResponse);
      }
      BadRequestError(`User "${userPayload.email}" already exists`);
    } catch (e) {
      next(e);
    }
  }

  static async updateUser(req, res, next) {
    const {
      body: userPayload,
      file = {},
      params: { id: userId },
      user: { id },
    } = req;
    try {
      const result = Joi.validate(userPayload, userUpdateSchema);
      if (result.error) {
        BadRequestError(getErrorMessages(result), STATUS_CODES.INVALID_INPUT);
      }
      const query = {
        where: {
          id: userId,
        },
      };

      const userExists = await User.findOne(query);
      if (userExists) {
        if (userPayload.password) {
          userPayload.password = generateHash(userPayload.password);
        }
        userPayload.avatar = file.key || userExists.avatar;
        await User.update(userPayload, query);
        delete userPayload.password;
        if (id === parseInt(userId, 10)) {
          UserController.generatePreSignedUrl([userPayload]);
        }

        if (file.key && userExists.avatar) {
          const avatarKeyObj = [{ Key: userExists.avatar }];
          cleanUnusedImages(avatarKeyObj);
        }
        return SuccessResponse(res, userPayload);
      }
      BadRequestError(`User does not exists`, STATUS_CODES.NOTFOUND);
    } catch (e) {
      next(e);
    }
  }

  static async deleteUsers(req, res, next) {
    const {
      body: { ids = [] },
    } = req;
    try {
      if (ids.length < 1) {
        BadRequestError(`User ids required`, STATUS_CODES.INVALID_INPUT);
      }
      const query = {
        where: {
          id: ids,
        },
      };
      const users = await User.findAll(query);

      const user = await User.destroy({
        where: {
          id: ids,
        },
        force: true,
      });
      const userKeyobjects = _.chain(users)
        .filter((userInfo) => !!userInfo.avatar)
        .map((userInfo) => ({ Key: userInfo.avatar }))
        .value();
      if (userKeyobjects.length > 0) {
        cleanUnusedImages(userKeyobjects);
      }
      return SuccessResponse(res, { count: user });
    } catch (e) {
      next(e);
    }
  }
}

export default UserController;
