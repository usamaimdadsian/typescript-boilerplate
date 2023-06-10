import express, { Application } from 'express';
import { configureRoutes } from './routes';
import { configureMiddlewares, afterRoutesMiddlewares } from './middlewares';

// Import other necessary dependencies and files

export class App {
  private app: Application;

  constructor() {
    this.app = express();
    configureMiddlewares(this.app)
    configureRoutes(this.app)
    afterRoutesMiddlewares(this.app)
    // Configure other necessary components
  }

  public listen(port: number, callback: () => void) {
    this.app.listen(port, callback);
  }
}
