import cors from "cors"
import helmet from "helmet"
import xss from "xss-clean"
import passport from "passport"
import compression from "compression"
import express, { Application, NextFunction, Response } from 'express';
import { HttpStatus, response, authLimiter } from '@/utils';
import auth from './autorize';
import { jwtStrategy } from "@/config/passport"
import config from "@/config/config"



const configureMiddlewares = (app: Application) => {
    // set security HTTP headers
    app.use(helmet());

    app.use(express.json())

    // parse urlencoded request body
    app.use(express.urlencoded({ extended: true }));

    // sanitize request data
    app.use(xss());

    // gzip compression
    app.use(compression());

    // enable cors
    app.use(cors());
    app.options('*', cors());

    // jwt authentication
    app.use(passport.initialize());
    passport.use('jwt', jwtStrategy);

    // limit repeated failed requests to auth endpoints
    if (config.env === 'production') {
        app.use('/auth', authLimiter);
    }

    app.use('/public', express.static(process.cwd() + "/public"))
}

const afterRoutesMiddlewares = (app: Application) => {
    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
        if (err.name === "ValidationError") {
            response(HttpStatus.BAD_REQUEST, res, { message: err.message })
        }
        else if (err.hasOwnProperty("status")){
            response(err.status, res, { message: err.message})
        }
        else {
            if (config.env === "development"){
                response(HttpStatus.INTERNAL_SERVER_ERROR, res, err.message)
            }else{
                response(HttpStatus.INTERNAL_SERVER_ERROR, res)
            }
        }
    });

    app.use((req, res, next) => {
        response(HttpStatus.NOT_FOUND,res)
    });
}

export {
    configureMiddlewares,
    afterRoutesMiddlewares,
    auth
}
