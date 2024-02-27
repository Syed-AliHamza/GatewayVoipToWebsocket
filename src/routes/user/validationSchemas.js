import Joi from 'joi';

export const userLoginSchema = Joi.object().keys({
  email: Joi.string().email({ minDomainAtoms: 2 }).required(),
  password: Joi.string().required(),
});

export const userSignUpSchema = Joi.object()
  .keys({
    username: Joi.string().min(8).required().label('Username'),
    email: Joi.string().email({ minDomainAtoms: 2 }).required(),
    password: Joi.string().min(6).required(),
    avatar: Joi.string(),
  })
  .unknown(true);

export const userUpdateSchema = Joi.object()
  .keys({
    password: Joi.string(),
    firstName: Joi.string().min(2).max(100),
    lastName: Joi.string().min(2).max(100),
    contactNo: Joi.string().alphanum(),
    extension: Joi.string(),
    locationId: Joi.number(),
    title: Joi.string(),
    departmentId: Joi.number(),
    joiningDate: Joi.date(),
    dob: Joi.date(),
  })
  .unknown(true);
