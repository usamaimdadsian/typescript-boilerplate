import express, { Application } from 'express';
import { configureRoutes } from './routes';
import { configureMiddlewares, afterRoutesMiddlewares } from './middlewares';
import { setupSwagger } from './swagger';

// Import other necessary dependencies and files

export class App {
  private app: Application;

  constructor() {
    this.app = express();
    configureMiddlewares(this.app)
    configureRoutes(this.app)
    setupSwagger(this.app)
    afterRoutesMiddlewares(this.app)
  }

  public listen(port: number, callback: () => void) {
    this.app.listen(port, callback);
  }
}
