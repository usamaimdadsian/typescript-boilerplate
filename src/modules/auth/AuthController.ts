import mongoose from 'mongoose';
import { Request, Response } from 'express';

import { IOptions, Controller, validate, EmailService } from '@/components';
import { HttpStatus, response, pick, ApiError } from '@/utils';

import AuthService from './AuthService';
import UserService from '@/modules/user/UserService';
import TokenService from '@/modules/token/TokenService';
import { AuthValidation } from './AuthValidation';


export class AuthController extends Controller {
    @validate(AuthValidation.register)
    public async register(req: Request, res: Response) {
        const user = await UserService.registerUser(req.body);
        const tokens = await TokenService.generateAuthTokens(user);
        response(HttpStatus.CREATED, res, { user, tokens })
    }

    @validate(AuthValidation.login)
    public async login(req: Request, res: Response) {
        const { email, password } = req.body;
        const user = await AuthService.loginUserWithEmailAndPassword(email, password);
        const tokens = await TokenService.generateAuthTokens(user);
        response(HttpStatus.ACCEPTED, res, { user, tokens })
    }


    @validate(AuthValidation.logout)
    public async logout(req: Request, res: Response) {
        await AuthService.logout(req.body.refreshToken);
        response(HttpStatus.NO_CONTENT, res);
    }


    @validate(AuthValidation.refreshTokens)
    public async refreshTokens(req: Request, res: Response) {
        const userWithTokens = await AuthService.refreshAuth(req.body.refreshToken);
        response(HttpStatus.OK, res, { ...userWithTokens });
    }

    public async forgotPassword(req: Request, res: Response) {
        const resetPasswordToken = await TokenService.generateResetPasswordToken(req.body.email);
        await EmailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
        response(HttpStatus.NO_CONTENT, res)

    }


    @validate(AuthValidation.resetPassword)
    public async resetPassword(req: Request, res: Response) {
        await AuthService.resetPassword(req.query['token'], req.body.password);
        response(HttpStatus.NO_CONTENT, res)
    }

    public async sendVerificationEmail(req: Request, res: Response) {
        const verifyEmailToken = await TokenService.generateVerifyEmailToken(req.user);
        await EmailService.sendVerificationEmail(req.user.email, verifyEmailToken, req.user.name);
        response(HttpStatus.NO_CONTENT, res)
    }

    public async verifyEmail(req: Request, res: Response) {
        await AuthService.verifyEmail(req.query['token']);
        response(HttpStatus.NO_CONTENT, res)
    }


}
