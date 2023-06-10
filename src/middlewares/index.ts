import express, { Application, NextFunction, Response } from 'express';
import { HttpStatus, response } from '@/utils';




export function configureMiddlewares(app: Application) {
    app.use(express.json())

}

export function afterRoutesMiddlewares(app: Application) {
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        if (err.name === "ValidationError"){
            response(HttpStatus.BAD_REQUEST, res, { data: err.message })
        }else{
            response(HttpStatus.INTERNAL_SERVER_ERROR,res)
        }
    });
}
