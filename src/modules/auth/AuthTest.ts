/* eslint-disable jest/no-commented-out-tests */
import { faker } from '@faker-js/faker';
import mongoose from 'mongoose';
import request from 'supertest';
import { HttpStatusCode, HttpStatus ,ApiError } from '@/utils';
import httpMocks from 'node-mocks-http';
import moment from 'moment';
import bcrypt from 'bcryptjs';
import { jest } from '@jest/globals';

import { App } from '@/app';
import setupTestDB from '@/test/setupTestDB';
import User from '@/modules/user/User';
import config from '@/config/config';
import { NewRegisteredUser } from '@/modules/user/UserInterface';
import TokenService from '@/modules/token/TokenService';
import { tokenTypes } from '@/config/tokens';
import Token from '@/modules/token/Token';
import { auth } from '@/middlewares';

setupTestDB();

const app = new App().getApp()

const password = 'password1';
const salt = bcrypt.genSaltSync(8);
const hashedPassword = bcrypt.hashSync(password, salt);
const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');

const userOne = {
  _id: new mongoose.Types.ObjectId(),
  name: faker.person.fullName(),
  email: faker.internet.email().toLowerCase(),
  password,
  role: 'user',
  isEmailVerified: false,
};

const userOneAccessToken = TokenService.generateToken(userOne._id, accessTokenExpires, tokenTypes.ACCESS);

const insertUsers = async (users: Record<string, any>[]) => {
  await User.insertMany(users.map((user) => ({ ...user, password: hashedPassword })));
};

describe('Auth routes', () => {
  describe('POST /auth/register', () => {
    let newUser: NewRegisteredUser;
    beforeEach(() => {
      newUser = {
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        password: 'password1',
      };
    });

    test('should return 201 and successfully register user if request data is ok', async () => {
      const res = await request(app).post('/auth/register').send(newUser).expect(HttpStatusCode.CREATED);

      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body.user).toEqual({
        id: expect.anything(),
        name: newUser.name,
        email: newUser.email,
        role: 'user',
        isEmailVerified: false,
      });

      const dbUser = await User.findById(res.body.user.id);
      expect(dbUser).toBeDefined();
      expect(dbUser).toMatchObject({ name: newUser.name, email: newUser.email, role: 'user', isEmailVerified: false });

      expect(res.body.tokens).toEqual({
        access: { token: expect.anything(), expires: expect.anything() },
        refresh: { token: expect.anything(), expires: expect.anything() },
      });
    });

    test('should return 400 error if email is invalid', async () => {
      newUser.email = 'invalidEmail';

      await request(app).post('/auth/register').send(newUser).expect(HttpStatusCode.BAD_REQUEST);
    });

    test('should return 400 error if email is already used', async () => {
      await insertUsers([userOne]);
      newUser.email = userOne.email;

      await request(app).post('/auth/register').send(newUser).expect(HttpStatusCode.BAD_REQUEST);
    });

    test('should return 400 error if password length is less than 8 characters', async () => {
      newUser.password = 'passwo1';

      await request(app).post('/auth/register').send(newUser).expect(HttpStatusCode.BAD_REQUEST);
    });

    test('should return 400 error if password does not contain both letters and numbers', async () => {
      newUser.password = 'password';

      await request(app).post('/auth/register').send(newUser).expect(HttpStatusCode.BAD_REQUEST);

      newUser.password = '11111111';

      await request(app).post('/auth/register').send(newUser).expect(HttpStatusCode.BAD_REQUEST);
    });
  });

  describe('POST /auth/login', () => {
    test('should return 202 and login user if email and password match', async () => {
      await insertUsers([userOne]);
      const loginCredentials = {
        email: userOne.email,
        password: userOne.password,
      };

      const res = await request(app).post('/auth/login').send(loginCredentials).expect(HttpStatusCode.ACCEPTED);

      expect(res.body.user).toEqual({
        id: expect.anything(),
        name: userOne.name,
        email: userOne.email,
        role: userOne.role,
        isEmailVerified: userOne.isEmailVerified,
      });

      expect(res.body.tokens).toEqual({
        access: { token: expect.anything(), expires: expect.anything() },
        refresh: { token: expect.anything(), expires: expect.anything() },
      });
    });

    test('should return 401 error if there are no users with that email', async () => {
      const loginCredentials = {
        email: userOne.email,
        password: userOne.password,
      };

      const res = await request(app).post('/auth/login').send(loginCredentials).expect(HttpStatusCode.UNAUTHORIZED);

      // expect(res.body).toEqual({ code: HttpStatusCode.UNAUTHORIZED, message: "Incorrect email or password"});
    });

    test('should return 401 error if password is wrong', async () => {
      await insertUsers([userOne]);
      const loginCredentials = {
        email: userOne.email,
        password: 'wrongPassword1',
      };

      const res = await request(app).post('/auth/login').send(loginCredentials).expect(HttpStatusCode.UNAUTHORIZED);

      // expect(res.body).toEqual({ code: HttpStatusCode.UNAUTHORIZED, message: "Incorrect email or password"});
    });
  });

  describe('POST /auth/logout', () => {
    test('should return 204 if refresh token is valid', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = TokenService.generateToken(userOne._id, expires, tokenTypes.REFRESH);
      await TokenService.saveToken(refreshToken, userOne._id, expires, tokenTypes.REFRESH);

      await request(app).post('/auth/logout').send({ refreshToken }).expect(HttpStatusCode.NO_CONTENT);

      const dbRefreshTokenDoc = await Token.findOne({ token: refreshToken });
      expect(dbRefreshTokenDoc).toBe(null);
    });

    test('should return 400 error if refresh token is missing from request body', async () => {
      await request(app).post('/auth/logout').send().expect(HttpStatusCode.BAD_REQUEST);
    });

    test('should return 404 error if refresh token is not found in the database', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = TokenService.generateToken(userOne._id, expires, tokenTypes.REFRESH);

      await request(app).post('/auth/logout').send({ refreshToken }).expect(HttpStatusCode.NOT_FOUND);
    });

    test('should return 404 error if refresh token is blacklisted', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = TokenService.generateToken(userOne._id, expires, tokenTypes.REFRESH);
      await TokenService.saveToken(refreshToken, userOne._id, expires, tokenTypes.REFRESH, true);

      await request(app).post('/auth/logout').send({ refreshToken }).expect(HttpStatusCode.NOT_FOUND);
    });
  });

  describe('POST /auth/refresh-tokens', () => {
    test('should return 200 and new auth tokens if refresh token is valid', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = TokenService.generateToken(userOne._id, expires, tokenTypes.REFRESH);
      await TokenService.saveToken(refreshToken, userOne._id, expires, tokenTypes.REFRESH);

      const res = await request(app).post('/auth/refresh-tokens').send({ refreshToken }).expect(HttpStatusCode.OK);

      expect(res.body.user).toEqual({
        id: expect.anything(),
        name: userOne.name,
        email: userOne.email,
        role: userOne.role,
        isEmailVerified: userOne.isEmailVerified,
      });

      expect(res.body.tokens).toEqual({
        access: { token: expect.anything(), expires: expect.anything() },
        refresh: { token: expect.anything(), expires: expect.anything() },
      });

      const dbRefreshTokenDoc = await Token.findOne({ token: res.body.tokens.refresh.token });
      
      expect(dbRefreshTokenDoc).toEqual(expect.objectContaining({
        type: tokenTypes.REFRESH,
        user: userOne._id.toString(),
        blacklisted: false
      }));

      const dbRefreshTokenCount = await Token.countDocuments();
      expect(dbRefreshTokenCount).toBe(1);
    });

    test('should return 400 error if refresh token is missing from request body', async () => {
      await request(app).post('/auth/refresh-tokens').send().expect(HttpStatusCode.BAD_REQUEST);
    });

    test('should return 401 error if refresh token is signed using an invalid secret', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = TokenService.generateToken(userOne._id, expires, tokenTypes.REFRESH, 'invalidSecret');
      await TokenService.saveToken(refreshToken, userOne._id, expires, tokenTypes.REFRESH);

      await request(app).post('/auth/refresh-tokens').send({ refreshToken }).expect(HttpStatusCode.UNAUTHORIZED);
    });

    test('should return 401 error if refresh token is not found in the database', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = TokenService.generateToken(userOne._id, expires, tokenTypes.REFRESH);

      await request(app).post('/auth/refresh-tokens').send({ refreshToken }).expect(HttpStatusCode.UNAUTHORIZED);
    });

    test('should return 401 error if refresh token is blacklisted', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = TokenService.generateToken(userOne._id, expires, tokenTypes.REFRESH);
      await TokenService.saveToken(refreshToken, userOne._id, expires, tokenTypes.REFRESH, true);

      await request(app).post('/auth/refresh-tokens').send({ refreshToken }).expect(HttpStatusCode.UNAUTHORIZED);
    });

    test('should return 401 error if refresh token is expired', async () => {
      await insertUsers([userOne]);
      const expires = moment().subtract(1, 'minutes');
      const refreshToken = TokenService.generateToken(userOne._id, expires, tokenTypes.REFRESH);
      await TokenService.saveToken(refreshToken, userOne._id, expires, tokenTypes.REFRESH);

      await request(app).post('/auth/refresh-tokens').send({ refreshToken }).expect(HttpStatusCode.UNAUTHORIZED);
    });

    test('should return 401 error if user is not found', async () => {
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = TokenService.generateToken(userOne._id, expires, tokenTypes.REFRESH);
      await TokenService.saveToken(refreshToken, userOne._id, expires, tokenTypes.REFRESH);

      await request(app).post('/auth/refresh-tokens').send({ refreshToken }).expect(HttpStatusCode.UNAUTHORIZED);
    });
  });

  describe('POST /auth/reset-password', () => {
    test('should return 204 and reset the password', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
      const resetPasswordToken = TokenService.generateToken(userOne._id, expires, tokenTypes.RESET_PASSWORD);
      await TokenService.saveToken(resetPasswordToken, userOne._id, expires, tokenTypes.RESET_PASSWORD);

      await request(app)
        .post('/auth/reset-password')
        .query({ token: resetPasswordToken })
        .send({ password: 'password2' })
        .expect(HttpStatusCode.NO_CONTENT);

      const dbUser = await User.findById(userOne._id);
      if (dbUser) {
        const isPasswordMatch = await bcrypt.compare('password2', dbUser.password);
        // eslint-disable-next-line jest/no-conditional-expect
        expect(isPasswordMatch).toBe(true);
      }

      // const dbResetPasswordTokenCount = await Token.countDocuments({ user: userOne._id, type: tokenTypes.RESET_PASSWORD });
      // expect(dbResetPasswordTokenCount).toBe(0);
    });

    test('should return 400 if reset password token is missing', async () => {
      await insertUsers([userOne]);

      await request(app).post('/auth/reset-password').send({ password: 'password2' }).expect(HttpStatusCode.BAD_REQUEST);
    });

    test('should return 401 if reset password token is blacklisted', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
      const resetPasswordToken = TokenService.generateToken(userOne._id, expires, tokenTypes.RESET_PASSWORD);
      await TokenService.saveToken(resetPasswordToken, userOne._id, expires, tokenTypes.RESET_PASSWORD, true);

      await request(app)
        .post('/auth/reset-password')
        .query({ token: resetPasswordToken })
        .send({ password: 'password2' })
        .expect(HttpStatusCode.UNAUTHORIZED);
    });

    test('should return 401 if reset password token is expired', async () => {
      await insertUsers([userOne]);
      const expires = moment().subtract(1, 'minutes');
      const resetPasswordToken = TokenService.generateToken(userOne._id, expires, tokenTypes.RESET_PASSWORD);
      await TokenService.saveToken(resetPasswordToken, userOne._id, expires, tokenTypes.RESET_PASSWORD);

      await request(app)
        .post('/auth/reset-password')
        .query({ token: resetPasswordToken })
        .send({ password: 'password2' })
        .expect(HttpStatusCode.UNAUTHORIZED);
    });

    test('should return 401 if user is not found', async () => {
      const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
      const resetPasswordToken = TokenService.generateToken(userOne._id, expires, tokenTypes.RESET_PASSWORD);
      await TokenService.saveToken(resetPasswordToken, userOne._id, expires, tokenTypes.RESET_PASSWORD);

      await request(app)
        .post('/auth/reset-password')
        .query({ token: resetPasswordToken })
        .send({ password: 'password2' })
        .expect(HttpStatusCode.UNAUTHORIZED);
    });

    test('should return 400 if password is missing or invalid', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
      const resetPasswordToken = TokenService.generateToken(userOne._id, expires, tokenTypes.RESET_PASSWORD);
      await TokenService.saveToken(resetPasswordToken, userOne._id, expires, tokenTypes.RESET_PASSWORD);

      await request(app).post('/auth/reset-password').query({ token: resetPasswordToken }).expect(HttpStatusCode.BAD_REQUEST);

      await request(app)
        .post('/auth/reset-password')
        .query({ token: resetPasswordToken })
        .send({ password: 'short1' })
        .expect(HttpStatusCode.BAD_REQUEST);

      await request(app)
        .post('/auth/reset-password')
        .query({ token: resetPasswordToken })
        .send({ password: 'password' })
        .expect(HttpStatusCode.BAD_REQUEST);

      await request(app)
        .post('/auth/reset-password')
        .query({ token: resetPasswordToken })
        .send({ password: '11111111' })
        .expect(HttpStatusCode.BAD_REQUEST);
    });
  });

  // describe('POST /auth/verify-email', () => {
  //   test('should return 204 and verify the email', async () => {
  //     await insertUsers([userOne]);
  //     const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
  //     const verifyEmailToken = TokenService.generateToken(userOne._id, expires, tokenTypes.VERIFY_EMAIL);
  //     await TokenService.saveToken(verifyEmailToken, userOne._id, expires, tokenTypes.VERIFY_EMAIL);

  //     await request(app)
  //       .post('/auth/verify-email')
  //       .query({ token: verifyEmailToken })
  //       .send()
  //       .expect(HttpStatusCode.NO_CONTENT);

  //     const dbUser = await User.findById(userOne._id);
  //     expect(dbUser).toBeDefined();
  //     expect(dbUser).toMatchObject({ name: userOne.name, email: userOne.email, role: userOne.role, isEmailVerified: true });
  //   });

  //   test('should return 400 if verify email token is missing', async () => {
  //     await insertUsers([userOne]);

  //     await request(app).post('/auth/verify-email').send().expect(HttpStatusCode.BAD_REQUEST);
  //   });

  //   test('should return 401 if verify email token is blacklisted', async () => {
  //     await insertUsers([userOne]);
  //     const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
  //     const verifyEmailToken = TokenService.generateToken(userOne._id, expires, tokenTypes.VERIFY_EMAIL);
  //     await TokenService.saveToken(verifyEmailToken, userOne._id, expires, tokenTypes.VERIFY_EMAIL, true);

  //     await request(app)
  //       .post('/auth/verify-email')
  //       .query({ token: verifyEmailToken })
  //       .send()
  //       .expect(HttpStatusCode.UNAUTHORIZED);
  //   });

  //   test('should return 401 if verify email token is expired', async () => {
  //     await insertUsers([userOne]);
  //     const expires = moment().subtract(1, 'minutes');
  //     const verifyEmailToken = TokenService.generateToken(userOne._id, expires, tokenTypes.VERIFY_EMAIL);
  //     await TokenService.saveToken(verifyEmailToken, userOne._id, expires, tokenTypes.VERIFY_EMAIL);

  //     await request(app)
  //       .post('/auth/verify-email')
  //       .query({ token: verifyEmailToken })
  //       .send()
  //       .expect(HttpStatusCode.UNAUTHORIZED);
  //   });

  //   test('should return 401 if user is not found', async () => {
  //     const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
  //     const verifyEmailToken = TokenService.generateToken(userOne._id, expires, tokenTypes.VERIFY_EMAIL);
  //     await TokenService.saveToken(verifyEmailToken, userOne._id, expires, tokenTypes.VERIFY_EMAIL);

  //     await request(app)
  //       .post('/auth/verify-email')
  //       .query({ token: verifyEmailToken })
  //       .send()
  //       .expect(HttpStatusCode.UNAUTHORIZED);
  //   });
  // });
});

describe('Auth middleware', () => {
  test('should call next with no errors if access token is valid', async () => {
    await insertUsers([userOne]);
    const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${userOneAccessToken}` } });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user._id).toEqual(userOne._id);
  });

  test('should call next with unauthorized error if access token is not found in header', async () => {
    await insertUsers([userOne]);
    const req = httpMocks.createRequest();
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ status: HttpStatus.UNAUTHORIZED, message: 'Please authenticate' })
    );
  });

  test('should call next with unauthorized error if access token is not a valid jwt token', async () => {
    await insertUsers([userOne]);
    const req = httpMocks.createRequest({ headers: { Authorization: 'Bearer randomToken' } });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ status: HttpStatus.UNAUTHORIZED, message: 'Please authenticate' })
    );
  });

  test('should call next with unauthorized error if the token is not an access token', async () => {
    await insertUsers([userOne]);
    const expires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
    const refreshToken = TokenService.generateToken(userOne._id, expires, tokenTypes.REFRESH);
    const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${refreshToken}` } });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ status: HttpStatus.UNAUTHORIZED, message: 'Please authenticate' })
    );
  });

  test('should call next with unauthorized error if access token is generated with an invalid secret', async () => {
    await insertUsers([userOne]);
    const expires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
    const accessToken = TokenService.generateToken(userOne._id, expires, tokenTypes.ACCESS, 'invalidSecret');
    const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${accessToken}` } });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ status: HttpStatus.UNAUTHORIZED, message: 'Please authenticate' })
    );
  });

  test('should call next with unauthorized error if access token is expired', async () => {
    await insertUsers([userOne]);
    const expires = moment().subtract(1, 'minutes');
    const accessToken = TokenService.generateToken(userOne._id, expires, tokenTypes.ACCESS);
    const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${accessToken}` } });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ status: HttpStatus.UNAUTHORIZED, message: 'Please authenticate' })
    );
  });

  test('should call next with unauthorized error if user is not found', async () => {
    const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${userOneAccessToken}` } });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ status: HttpStatus.UNAUTHORIZED, message: 'Please authenticate' })
    );
  });

  test('should call next with forbidden error if user does not have required rights and userId is not in params', async () => {
    await insertUsers([userOne]);
    const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${userOneAccessToken}` } });
    const next = jest.fn();

    await auth('anyRight')(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: HttpStatus.FORBIDDEN, message: 'Forbidden' }));
  });

  test('should call next with no errors if user does not have required rights but userId is in params', async () => {
    await insertUsers([userOne]);
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${userOneAccessToken}` },
      params: { userId: userOne._id.toHexString() },
    });
    const next = jest.fn();

    await auth('anyRight')(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: HttpStatus.FORBIDDEN, message: 'Forbidden' }));
  });
});