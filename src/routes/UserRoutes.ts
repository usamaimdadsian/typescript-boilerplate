import express, { Router } from 'express';
import { UserController } from '@/controllers';

export const userRouter = Router();
const userController = new UserController();

userRouter.get('/', userController.index);
userRouter.get('/:id', userController.show);
userRouter.post('/', userController.create);
userRouter.put('/:id', userController.update);
userRouter.delete('/:id', userController.delete);
