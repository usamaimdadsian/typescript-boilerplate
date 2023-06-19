import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { HttpStatus, ApiError } from '@/utils';
// import { roleRights } from '../../config/roles';
import config from '@/config/config';
import { IUserDoc } from '@/modules/user/UserInterface';

const verifyCallback =
    (req: Request, resolve: any, reject: any, roles: string[]) =>
        async (err: Error, user: IUserDoc, info: string) => {
            if (err || info || !user) {
                return reject(new ApiError(HttpStatus.UNAUTHORIZED, 'Please authenticate'));
            }
            req.user = user;

            if (roles.length) {
                if (!roles.includes(user.role)) {
                    return reject(new ApiError(HttpStatus.FORBIDDEN, 'Forbidden'));
                }
            }

            resolve();
        };

const auth =
    (...roles: string[]) => {
        if (roles.length < 1){
            roles = config.roles
        }
        return async (req: Request, res: Response, next: NextFunction) =>
            new Promise<void>((resolve, reject) => {
                passport.authenticate('jwt', { session: false }, verifyCallback(req, resolve, reject, roles))(req, res, next);
            })
                .then(() => next())
                .catch((err) => next(err));
    }

export default auth;