import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from "express"

const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'Your API Title',
        version: '1.0.0',
        description: 'API documentation for your project',
    },
};

const options = {
    swaggerDefinition,
    apis: ['src/modules/**/*Swagger.yaml'], // Replace with the path to your API route files
};

const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app: Application) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
