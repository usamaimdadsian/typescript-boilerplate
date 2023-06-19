import Joi from "joi";

import { customValidators } from "@/utils";
import { NewRegisteredUser } from "@/modules/user/UserInterface";



export class AuthValidation {
  static registerBody: Record<keyof NewRegisteredUser, any> = {
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(customValidators.password),
    name: Joi.string().required(),
  };
  
  static register = {
    body: Joi.object().keys(this.registerBody),
  };
  
  static login = {
    body: Joi.object().keys({
      email: Joi.string().required(),
      password: Joi.string().required(),
    }),
  };
  
  static logout = {
    body: Joi.object().keys({
      refreshToken: Joi.string().required(),
    }),
  };
  
  static refreshTokens = {
    body: Joi.object().keys({
      refreshToken: Joi.string().required(),
    }),
  };
  
  static forgotPassword = {
    body: Joi.object().keys({
      email: Joi.string().email().required(),
    }),
  };
  
  static resetPassword = {
    query: Joi.object().keys({
      token: Joi.string().required(),
    }),
    body: Joi.object().keys({
      password: Joi.string().required().custom(customValidators.password),
    }),
  };
  
  static verifyEmail = {
    query: Joi.object().keys({
      token: Joi.string().required(),
    }),
  };


}