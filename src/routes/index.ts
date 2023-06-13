import { Router, Request, Response } from 'express';
import { userRouter } from '@/modules';
import dynamoDB from '@/config/aws';


export function configureRoutes(router: Router) {

    router.get('/', (req: Request, res: Response) => {
        // Example: Get an item from DynamoDB
        dynamoDB.listTables({}, (err, data) => {
            if (err) console.log(err, err.stack);
            else console.log(data);
          });
        res.send('Hello, World!');
    });

    router.use('/users', userRouter);

}
