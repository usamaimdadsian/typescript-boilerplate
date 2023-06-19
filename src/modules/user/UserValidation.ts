import Joi from "joi";
import config from "@/config/config";
import { customValidators } from "@/utils";

export class UserValidation {
  static create = {
    body: Joi.object().keys({
      email: Joi.string().required().email(),
      password: Joi.string().required().custom(customValidators.password),
      name: Joi.string().required(),
      role: Joi.string().required().valid(...config.roles),
    }),
  };

  static index = {
    query: Joi.object().keys({
      name: Joi.string(),
      role: Joi.string(),
      sortBy: Joi.string(),
      projectBy: Joi.string(),
      limit: Joi.number().integer(),
      page: Joi.number().integer(),
    }),
  };

  static show = {
    params: Joi.object().keys({
      userId: Joi.string().custom(customValidators.objectId),
    }),
  };

  static update = {
    params: Joi.object().keys({
      userId: Joi.required().custom(customValidators.objectId),
    }),
    body: Joi.object()
      .keys({
        email: Joi.string().email(),
        password: Joi.string().custom(customValidators.password),
        name: Joi.string(),
      })
      .min(1),
  };

  static delete = {
    params: Joi.object().keys({
      userId: Joi.string().custom(customValidators.objectId),
    }),
  };
}