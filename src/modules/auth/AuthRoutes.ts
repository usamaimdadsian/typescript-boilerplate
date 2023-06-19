import express, { Router } from 'express';
import { AuthController } from './AuthController';
import { auth } from '@/middlewares';


export const authRouter = Router();
const authController = new AuthController();

authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);
authRouter.post('/logout', authController.logout);
authRouter.post('/refresh-tokens', authController.refreshTokens);
authRouter.post('/forgot-password', authController.forgotPassword);
authRouter.post('/reset-password', authController.resetPassword);
authRouter.post('/send-verification-email', auth(), authController.sendVerificationEmail);
authRouter.post('/verify-email', authController.verifyEmail);
