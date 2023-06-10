abstract class Controller {
    
    abstract index(req: Request, res: Response): void;
    abstract create(req: Request, res: Response): void;
    abstract show(req: Request, res: Response): void;
    abstract update(req: Request, res: Response): void;
    abstract delete(req: Request, res: Response): void;
}

export default Controller
