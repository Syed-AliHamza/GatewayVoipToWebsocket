import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import AWS from 'aws-sdk';
import { AWS_CONFIG } from './constants';

import { BadRequest, NotFound } from '../error';

const s3 = new AWS.S3({
  accessKeyId: AWS_CONFIG.AWS_ACCESS_KEY,
  secretAccessKey: AWS_CONFIG.AWS_SECRET_KEY,
});

/**
 * Validates that the provided password matches the hashed counterpart
 *
 * @category validation
 * @param {String} password The password provided by the user
 * @param {String} hashedPassword The password stored in your db
 * @returns {Boolean}
 */
const validatePassword = (password, hashedPassword) => password === hashedPassword;

// Hashed passwords !
// const hash = crypto.pbkdf2Sync(password, process.env.SALT, 10000, 512, 'sha512').toString('hex');
// return hash === hashedPassword;
/**
 * Generates Hash for the user password
 *
 * @category validation
 * @param {String} password The password provided by the user
 * @returns {String} password The hashed password
 */
const generateHash = (password) =>
  crypto.pbkdf2Sync(password, process.env.SALT, 10000, 64, 'sha512').toString('hex');

/**
 * generate the json web token that we'll use for authentication
 *
 * @since 1.0.0
 * @category authentication
 * @param    {Any} id The user ID
 * @param    {String} email The email of the user
 * @param    {String} name The name of the user
 * @param    {String} surname The surname of the user
 * @returns  {Object} The generated JWT
 */

const generateJWT = ({ id, email, name, role }) =>
  jwt.sign(
    {
      id,
      email,
      name,
      role,
    },
    process.env.JWT_SECRET
  );

const getErrorMessages = (joiErrorObject) => joiErrorObject.error.details.map((e) => e.message);

const getPassportErrorMessage = (errorObject) => errorObject.errors && errorObject.errors.account;

const BadRequestError = (message, code) => {
  throw new BadRequest(message, code);
};

const NotFoundError = (message, code) => {
  throw new NotFound(message, code);
};

const SuccessResponse = (res, data) => {
  res.status(200).json({
    data,
  });
};

const stripHtmlTags = (htmlString) => htmlString.replace(/(<([^>]+)>)/gi, '');

const cleanUnusedImages = async (objects) => {
  const params = {
    Bucket: AWS_CONFIG.BUCKET,
    Delete: { Objects: objects },
  };
  await s3.deleteObjects(params).promise();
};

const generatePreSignedUrlForGetObject = (key) =>
  s3.getSignedUrl('getObject', {
    Bucket: AWS_CONFIG.BUCKET,
    Key: key,
    Expires: 60 * 60 * 24, // 1 day expiry
  });

export {
  stripHtmlTags,
  generateHash,
  validatePassword,
  generateJWT,
  getErrorMessages,
  getPassportErrorMessage,
  BadRequestError,
  NotFoundError,
  SuccessResponse,
  generatePreSignedUrlForGetObject,
  cleanUnusedImages,
};
