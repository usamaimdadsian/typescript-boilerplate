import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { faker } from '@faker-js/faker';
import { HttpStatusCode } from '@/utils';
import moment from 'moment';
import config from '@/config/config';
import { tokenTypes } from '@/config/tokens';
import TokenService from '@/modules/token/TokenService';
import { App } from '@/app';
import setupTestDB from '@/test/setupTestDB';
import User from './User';
import { NewCreatedUser } from './UserInterface';

setupTestDB();

const password = 'password1';
const salt = bcrypt.genSaltSync(8);
const hashedPassword = bcrypt.hashSync(password, salt);
const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
const app = new App().getApp()

const userOne = {
    _id: new mongoose.Types.ObjectId(),
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    password,
    role: 'user',
    isEmailVerified: false,
};

const userTwo = {
    _id: new mongoose.Types.ObjectId(),
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    password,
    role: 'user',
    isEmailVerified: false,
};

const admin = {
    _id: new mongoose.Types.ObjectId(),
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    password,
    role: 'admin',
    isEmailVerified: false,
};

const userOneAccessToken = TokenService.generateToken(userOne._id, accessTokenExpires, tokenTypes.ACCESS);
const adminAccessToken = TokenService.generateToken(admin._id, accessTokenExpires, tokenTypes.ACCESS);

const insertUsers = async (users: Record<string, any>[]) => {
    await User.insertMany(users.map((user) => ({ ...user, password: hashedPassword })));
};

describe('User routes', () => {
    describe('POST /users', () => {
        let newUser: NewCreatedUser;

        beforeEach(() => {
            newUser = {
                name: faker.person.fullName(),
                email: faker.internet.email().toLowerCase(),
                password: 'password1',
                role: 'user',
            };
        });

        test('should return 201 and successfully create new user if data is ok', async () => {
            await insertUsers([admin]);

            const res = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .send(newUser)
                .expect(HttpStatusCode.CREATED);

            expect(res.body).not.toHaveProperty('password');
            expect(res.body).toEqual({
                id: expect.anything(),
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                isEmailVerified: false,
            });

            const dbUser = await User.findById(res.body.id);
            expect(dbUser).toBeDefined();
            if (!dbUser) return;

            expect(dbUser.password).not.toBe(newUser.password);
            expect(dbUser).toMatchObject({ name: newUser.name, email: newUser.email, role: newUser.role, isEmailVerified: false });
        });

        test('should be able to create an admin as well', async () => {
            await insertUsers([admin]);
            newUser.role = 'admin';

            const res = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .send(newUser)
                .expect(HttpStatusCode.CREATED);

            expect(res.body.role).toBe('admin');

            const dbUser = await User.findById(res.body.id);
            expect(dbUser).toBeDefined();
            if (!dbUser) return;
            expect(dbUser.role).toBe('admin');
        });

        test('should return 401 error if access token is missing', async () => {
            await request(app).post('/users').send(newUser).expect(HttpStatusCode.UNAUTHORIZED);
        });

        test('should return 403 error if logged in user is not admin', async () => {
            await insertUsers([userOne]);

            await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send(newUser)
                .expect(HttpStatusCode.FORBIDDEN);
        });

        test('should return 400 error if email is invalid', async () => {
            await insertUsers([admin]);
            newUser.email = 'invalidEmail';

            await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .send(newUser)
                .expect(HttpStatusCode.BAD_REQUEST);
        });

        test('should return 400 error if email is already used', async () => {
            await insertUsers([admin, userOne]);
            newUser.email = userOne.email;

            await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .send(newUser)
                .expect(HttpStatusCode.BAD_REQUEST);
        });

        test('should return 400 error if password length is less than 8 characters', async () => {
            await insertUsers([admin]);
            newUser.password = 'passwo1';

            await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .send(newUser)
                .expect(HttpStatusCode.BAD_REQUEST);
        });

        test('should return 400 error if password does not contain both letters and numbers', async () => {
            await insertUsers([admin]);
            newUser.password = 'password';

            await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .send(newUser)
                .expect(HttpStatusCode.BAD_REQUEST);

            newUser.password = '1111111';

            await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .send(newUser)
                .expect(HttpStatusCode.BAD_REQUEST);
        });

        test('should return 400 error if role is neither user nor admin', async () => {
            await insertUsers([admin]);
            (newUser as any).role = 'invalid';

            await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .send(newUser)
                .expect(HttpStatusCode.BAD_REQUEST);
        });
    });

    describe('GET /users', () => {
        test('should return 200 and apply the default query options', async () => {
            await insertUsers([userOne, userTwo, admin]);

            const res = await request(app)
                .get('/users')
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .send()
                .expect(HttpStatusCode.OK);

            expect(res.body).toEqual({
                results: expect.any(Array),
                page: 1,
                limit: 10,
                totalPages: 1,
                totalResults: 3,
            });
            expect(res.body.results).toHaveLength(3);
            expect(res.body.results[0]).toEqual({
                id: userOne._id.toHexString(),
                name: userOne.name,
                email: userOne.email,
                role: userOne.role,
                isEmailVerified: userOne.isEmailVerified,
            });
        });

        test('should return 401 if access token is missing', async () => {
            await insertUsers([userOne, userTwo, admin]);

            await request(app).get('/users').send().expect(HttpStatusCode.UNAUTHORIZED);
        });

        test('should return 403 if a non-admin is trying to access all users', async () => {
            await insertUsers([userOne, userTwo, admin]);

            await request(app)
                .get('/users')
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(HttpStatusCode.FORBIDDEN);
        });

        test('should correctly apply filter on name field', async () => {
            await insertUsers([userOne, userTwo, admin]);

            const res = await request(app)
                .get('/users')
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .query({ name: userOne.name })
                .send()
                .expect(HttpStatusCode.OK);

            expect(res.body).toEqual({
                results: expect.any(Array),
                page: 1,
                limit: 10,
                totalPages: 1,
                totalResults: 1,
            });
            expect(res.body.results).toHaveLength(1);
            expect(res.body.results[0].id).toBe(userOne._id.toHexString());
        });

        test('should correctly apply filter on role field', async () => {
            await insertUsers([userOne, userTwo, admin]);

            const res = await request(app)
                .get('/users')
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .query({ role: 'user' })
                .send()
                .expect(HttpStatusCode.OK);

            expect(res.body).toEqual({
                results: expect.any(Array),
                page: 1,
                limit: 10,
                totalPages: 1,
                totalResults: 2,
            });
            expect(res.body.results).toHaveLength(2);
            expect(res.body.results[0].id).toBe(userOne._id.toHexString());
            expect(res.body.results[1].id).toBe(userTwo._id.toHexString());
        });

        test('should correctly sort the returned array if descending sort param is specified', async () => {
            await insertUsers([userOne, userTwo, admin]);

            const res = await request(app)
                .get('/users')
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .query({ sortBy: 'role:desc' })
                .send()
                .expect(HttpStatusCode.OK);

            expect(res.body).toEqual({
                results: expect.any(Array),
                page: 1,
                limit: 10,
                totalPages: 1,
                totalResults: 3,
            });
            expect(res.body.results).toHaveLength(3);
            expect(res.body.results[0].id).toBe(userOne._id.toHexString());
            expect(res.body.results[1].id).toBe(userTwo._id.toHexString());
            expect(res.body.results[2].id).toBe(admin._id.toHexString());
        });

        test('should correctly sort the returned array if ascending sort param is specified', async () => {
            await insertUsers([userOne, userTwo, admin]);

            const res = await request(app)
                .get('/users')
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .query({ sortBy: 'role:asc' })
                .send()
                .expect(HttpStatusCode.OK);

            expect(res.body).toEqual({
                results: expect.any(Array),
                page: 1,
                limit: 10,
                totalPages: 1,
                totalResults: 3,
            });
            expect(res.body.results).toHaveLength(3);
            expect(res.body.results[0].id).toBe(admin._id.toHexString());
            expect(res.body.results[1].id).toBe(userOne._id.toHexString());
            expect(res.body.results[2].id).toBe(userTwo._id.toHexString());
        });

        test('should correctly sort the returned array if multiple sorting criteria are specified', async () => {
            await insertUsers([userOne, userTwo, admin]);

            const res = await request(app)
                .get('/users')
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .query({ sortBy: 'role:desc,name:asc' })
                .send()
                .expect(HttpStatusCode.OK);

            expect(res.body).toEqual({
                results: expect.any(Array),
                page: 1,
                limit: 10,
                totalPages: 1,
                totalResults: 3,
            });
            expect(res.body.results).toHaveLength(3);

            const expectedOrder = [userOne, userTwo, admin].sort((a, b) => {
                if (a.role! < b.role!) {
                    return 1;
                }
                if (a.role! > b.role!) {
                    return -1;
                }
                return a.name < b.name ? -1 : 1;
            });

            expectedOrder.forEach((user, index) => {
                expect(res.body.results[index].id).toBe(user._id.toHexString());
            });
        });

        test('should limit returned array if limit param is specified', async () => {
            await insertUsers([userOne, userTwo, admin]);

            const res = await request(app)
                .get('/users')
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .query({ limit: 2 })
                .send()
                .expect(HttpStatusCode.OK);

            expect(res.body).toEqual({
                results: expect.any(Array),
                page: 1,
                limit: 2,
                totalPages: 2,
                totalResults: 3,
            });
            expect(res.body.results).toHaveLength(2);
            expect(res.body.results[0].id).toBe(userOne._id.toHexString());
            expect(res.body.results[1].id).toBe(userTwo._id.toHexString());
        });

        test('should return the correct page if page and limit params are specified', async () => {
            await insertUsers([userOne, userTwo, admin]);

            const res = await request(app)
                .get('/users')
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .query({ page: 2, limit: 2 })
                .send()
                .expect(HttpStatusCode.OK);

            expect(res.body).toEqual({
                results: expect.any(Array),
                page: 2,
                limit: 2,
                totalPages: 2,
                totalResults: 3,
            });
            expect(res.body.results).toHaveLength(1);
            expect(res.body.results[0].id).toBe(admin._id.toHexString());
        });
    });

    describe('GET /users/:userId', () => {
        test('should return 200 and the user object if data is ok', async () => {
            await insertUsers([userOne, admin]);

            const res = await request(app)
                .get(`/users/${userOne._id}`)
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .send()
                .expect(HttpStatusCode.OK);

            expect(res.body).not.toHaveProperty('password');
            expect(res.body).toEqual({
                id: userOne._id.toHexString(),
                email: userOne.email,
                name: userOne.name,
                role: userOne.role,
                isEmailVerified: userOne.isEmailVerified,
            });
        });

        test('should return 401 error if access token is missing', async () => {
            await insertUsers([userOne]);

            await request(app).get(`/users/${userOne._id}`).send().expect(HttpStatusCode.UNAUTHORIZED);
        });

        test('should return 403 error if user is trying to get another user', async () => {
            await insertUsers([userOne, userTwo]);

            await request(app)
                .get(`/users/${userTwo._id}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(HttpStatusCode.FORBIDDEN);
        });

        test('should return 200 and the user object if admin is trying to get another user', async () => {
            await insertUsers([userOne, admin]);

            await request(app)
                .get(`/users/${userOne._id}`)
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .send()
                .expect(HttpStatusCode.OK);
        });

        test('should return 400 error if userId is not a valid mongo id', async () => {
            await insertUsers([admin]);

            await request(app)
                .get('/users/invalidId')
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .send()
                .expect(HttpStatusCode.BAD_REQUEST);
        });

        test('should return 404 error if user is not found', async () => {
            await insertUsers([admin]);

            await request(app)
                .get(`/users/${userOne._id}`)
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .send()
                .expect(HttpStatusCode.NOT_FOUND);
        });
    });

    describe('DELETE /users/:userId', () => {
        test('should return 204 if data is ok', async () => {
            await insertUsers([userOne, admin]);

            await request(app)
                .delete(`/users/${userOne._id}`)
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .send()
                .expect(HttpStatusCode.NO_CONTENT);

            const dbUser = await User.findById(userOne._id);
            expect(dbUser).toBeNull();
        });

        test('should return 401 error if access token is missing', async () => {
            await insertUsers([userOne]);

            await request(app).delete(`/users/${userOne._id}`).send().expect(HttpStatusCode.UNAUTHORIZED);
        });

        test('should return 403 error if user is trying to delete another user', async () => {
            await insertUsers([userOne, userTwo]);

            await request(app)
                .delete(`/users/${userTwo._id}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send()
                .expect(HttpStatusCode.FORBIDDEN);
        });

        test('should return 204 if admin is trying to delete another user', async () => {
            await insertUsers([userOne, admin]);

            await request(app)
                .delete(`/users/${userOne._id}`)
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .send()
                .expect(HttpStatusCode.NO_CONTENT);
        });

        test('should return 400 error if userId is not a valid mongo id', async () => {
            await insertUsers([admin]);

            await request(app)
                .delete('/users/invalidId')
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .send()
                .expect(HttpStatusCode.BAD_REQUEST);
        });

        test('should return 404 error if user already is not found', async () => {
            await insertUsers([admin]);

            await request(app)
                .delete(`/users/${userOne._id}`)
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .send()
                .expect(HttpStatusCode.NOT_FOUND);
        });
    });

    describe('PATCH /users/:userId', () => {
        test('should return 200 and successfully update user if data is ok', async () => {
            await insertUsers([userOne,admin]);
            const updateBody = {
                name: faker.person.fullName(),
                email: faker.internet.email().toLowerCase(),
                password: 'newPassword1',
            };

            const res = await request(app)
                .patch(`/users/${userOne._id}`)
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .send(updateBody)
                .expect(HttpStatusCode.OK);

            expect(res.body).not.toHaveProperty('password');
            expect(res.body).toEqual({
                id: userOne._id.toHexString(),
                name: updateBody.name,
                email: updateBody.email,
                role: 'user',
                isEmailVerified: false,
            });

            const dbUser = await User.findById(userOne._id);
            expect(dbUser).toBeDefined();
            if (!dbUser) return;
            expect(dbUser.password).not.toBe(updateBody.password);
            expect(dbUser).toMatchObject({ name: updateBody.name, email: updateBody.email, role: 'user' });
        });

        test('should return 401 error if access token is missing', async () => {
            await insertUsers([userOne]);
            const updateBody = { name: faker.person.fullName() };

            await request(app).patch(`/users/${userOne._id}`).send(updateBody).expect(HttpStatusCode.UNAUTHORIZED);
        });

        test('should return 403 if user is updating another user', async () => {
            await insertUsers([userOne, userTwo]);
            const updateBody = { name: faker.person.fullName() };

            await request(app)
                .patch(`/users/${userTwo._id}`)
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send(updateBody)
                .expect(HttpStatusCode.FORBIDDEN);
        });

        test('should return 200 and successfully update user if admin is updating another user', async () => {
            await insertUsers([userOne, admin]);
            const updateBody = { name: faker.person.fullName() };

            await request(app)
                .patch(`/users/${userOne._id}`)
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .send(updateBody)
                .expect(HttpStatusCode.OK);
        });

        test('should return 404 if admin is updating another user that is not found', async () => {
            await insertUsers([admin]);
            const updateBody = { name: faker.person.fullName() };

            await request(app)
                .patch(`/users/${userOne._id}`)
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .send(updateBody)
                .expect(HttpStatusCode.NOT_FOUND);
        });

        test('should return 400 error if userId is not a valid mongo id', async () => {
            await insertUsers([admin]);
            const updateBody = { name: faker.person.fullName() };

            await request(app)
                .patch(`/users/invalidId`)
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .send(updateBody)
                .expect(HttpStatusCode.BAD_REQUEST);
        });

        test('should return 400 if email is invalid', async () => {
            await insertUsers([userOne, admin]);
            const updateBody = { email: 'invalidEmail' };

            await request(app)
                .patch(`/users/${userOne._id}`)
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .send(updateBody)
                .expect(HttpStatusCode.BAD_REQUEST);
        });

        test('should return 400 if email is already taken', async () => {
            await insertUsers([userOne, userTwo, admin]);
            const updateBody = { email: userTwo.email };

            await request(app)
                .patch(`/users/${userOne._id}`)
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .send(updateBody)
                .expect(HttpStatusCode.BAD_REQUEST);
        });

        test('should not return 400 if email is my email', async () => {
            await insertUsers([userOne, admin]);
            const updateBody = { email: userOne.email };

            await request(app)
                .patch(`/users/${userOne._id}`)
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .send(updateBody)
                .expect(HttpStatusCode.OK);
        });

        test('should return 400 if password length is less than 8 characters', async () => {
            await insertUsers([userOne, admin]);
            const updateBody = { password: 'passwo1' };

            await request(app)
                .patch(`/users/${userOne._id}`)
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .send(updateBody)
                .expect(HttpStatusCode.BAD_REQUEST);
        });

        test('should return 400 if password does not contain both letters and numbers', async () => {
            await insertUsers([userOne, admin]);
            const updateBody = { password: 'password' };

            await request(app)
                .patch(`/users/${userOne._id}`)
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .send(updateBody)
                .expect(HttpStatusCode.BAD_REQUEST);

            updateBody.password = '11111111';

            await request(app)
                .patch(`/users/${userOne._id}`)
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .send(updateBody)
                .expect(HttpStatusCode.BAD_REQUEST);
        });
    });
});