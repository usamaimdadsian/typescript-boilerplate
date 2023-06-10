import { Router, Request, Response } from 'express';
import { userRouter } from '@/modules';


export function configureRoutes(router: Router) {

    router.get('/', (req: Request, res: Response) => {
        res.send('Hello, World!');
    });

    router.use('/users', userRouter);

}
