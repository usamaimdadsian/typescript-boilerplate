import { Request, Response } from 'express';
import { UserController } from '../src/controllers';
import { HttpStatus } from '../src/utils';

describe('UserController', () => {
  let userController: UserController;
  let req: Request;
  let res: Response;

  beforeEach(() => {
    userController = new UserController();
    req = {} as Request;
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
  });

  describe('index', () => {
    it('should fetch all users and return them in the response', () => {
      userController.index(req, res);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith([
        { id: 1, name: 'John Doe' },
        { id: 2, name: 'Jane Smith' },
      ]);
    });
  });

  describe('show', () => {
    it('should fetch a user by ID and return it in the response if found', () => {
      req.params = { id: '1' };

      userController.show(req, res);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith({ id: 1, name: 'John Doe' });
    });

    it('should return a "NO_CONTENT" response if the user is not found', () => {
      req.params = { id: '2' };

      userController.show(req, res);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new user and return it in the response', () => {
      req.body = { name: 'Jane Smith' };

      userController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(res.json).toHaveBeenCalledWith({ id: 1, name: 'Jane Smith' });
    });
  });

  describe('update', () => {
    it('should update a user and return it in the response if found', () => {
      req.params = { id: '1' };
      req.body = { name: 'Updated Name' };

      userController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith({ id: 1, name: 'Updated Name' });
    });

    it('should return a "NOT_FOUND" response if the user is not found', () => {
      req.params = { id: '2' };
      req.body = { name: 'Updated Name' };

      userController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a user and return a success response', () => {
      req.params = { id: '1' };

      userController.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalled();
    });
  });
});
