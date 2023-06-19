import {auth} from "@/middlewares"
import express, { Router } from 'express';
import { UserController } from './UserController';


export const userRouter = Router();
const userController = new UserController();

userRouter.use(auth("admin"))
userRouter.get('/', userController.index);
userRouter.get('/:userId', userController.show);
userRouter.post('/', userController.create);
userRouter.patch('/:userId', userController.update);
userRouter.delete('/:userId', userController.delete);
