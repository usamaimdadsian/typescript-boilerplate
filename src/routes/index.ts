import { Router, Request, Response } from 'express';
import { userRouter, authRouter } from '@/modules';


export function configureRoutes(router: Router) {

    router.get('/', (req: Request, res: Response) => {
        // Example: Get an item from DynamoDB
        res.send('Hello, World!');
    });

    router.use('/users', userRouter);

    router.use('/auth', authRouter)

}
