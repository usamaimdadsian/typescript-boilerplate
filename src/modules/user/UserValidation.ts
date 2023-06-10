import { User } from "./User";
import Joi from "joi";
import { ValidationError } from "@/utils";

export class UserValidation {
  static validate(user: User): void {
    const schema = Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
    });

    const { error } = schema.validate(user);
    if (error) {
      // console.log("Invalid user input:", error.details[0].message);
      throw new ValidationError(error.details[0].message)
    }

    // Add more custom validations if needed
  }
}