import Joi from 'joi';

export const registerValidation = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
});

export const loginValidation = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required()
}); 