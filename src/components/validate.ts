
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

import { pick, ValidationError, catchAsync } from '@/utils';


const validate = (schema: Record<string, any>) => {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = catchAsync(async function (req: Request, res: Response, next: NextFunction) {
      const validSchema = pick(schema, ['params', 'query', 'body']);
      const object = pick(req, Object.keys(validSchema));
      const { value, error } = Joi.compile(validSchema)
        .prefs({ errors: { label: 'key' } })
        .validate(object);

      if (error) {
        const errorMessage = error.details.map((details) => details.message).join(', ');
        return next(new ValidationError(errorMessage));
      }

      Object.assign(req, value);
      return originalMethod.call(this, req, res);
    });
  };
};


export default validate;