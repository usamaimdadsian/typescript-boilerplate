import mongoose from 'mongoose';
import { Request, Response } from 'express';

import { IOptions, Controller, validate } from '@/components';
import { HttpStatus, response, pick, ApiError } from '@/utils';

import UserService from './UserService';
import { UserValidation } from './UserValidation';


export class UserController extends Controller {

    @validate(UserValidation.index)
    public async index(req: Request, res: Response){
        const filter = pick(req.query, ['name', 'role']);
        const options: IOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);
        const result = await UserService.queryUsers(filter, options);
        response(HttpStatus.OK, res, result)
    };

    @validate(UserValidation.show)
    public async show(req: Request, res: Response){
        const user = await UserService.getUserById(req.params.userId);
        if (!user) {
            throw new ApiError(HttpStatus.NOT_FOUND, 'User not found');
        }
        response(HttpStatus.OK, res, user)
    };

    @validate(UserValidation.create)
    public async create(req: Request, res: Response){
        const user = await UserService.createUser(req.body);
        response(HttpStatus.CREATED, res, user)
    };


    @validate(UserValidation.update)
    public async update(req: Request, res: Response){
        const user = await UserService.updateUserById(new mongoose.Types.ObjectId(req.params.userId), req.body);

        if (user) {
            response(HttpStatus.OK, res, user)
        } else {
            response(HttpStatus.NOT_FOUND, res)
        }
    };


    @validate(UserValidation.delete)
    public async delete(req: Request, res: Response){
        await UserService.deleteUserById(req.params.userId);
        response(HttpStatus.NO_CONTENT, res)
    };
}
