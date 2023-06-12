import { Request, Response, NextFunction } from "express"

import { HttpStatus, response } from "@/utils";

type UserRole = 'admin' | 'user'

export function authorize(role: UserRole) {
    return (req: Request, res: Response, next: NextFunction) => {
        console.log("autorization")
        const user_Role: UserRole = req.user.role

        if (user_Role === role) {
            next()
        } else {

            response(HttpStatus.FORBIDDEN, res)
        }
        // if (req.user.role === role) {
        //     // User has the required role, proceed with the request
        //     next();
        // } else {
        //     // User does not have the required role, return an error
        //     response(HttpStatus.FORBIDDEN,res)
        // }
    };
}