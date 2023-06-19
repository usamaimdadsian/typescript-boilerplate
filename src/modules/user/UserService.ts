import mongoose from 'mongoose';


import User from './User';
import { ApiError, HttpStatus } from '@/utils';
import { QueryResult, IOptions } from '@/components';
import { NewCreatedUser, UpdateUserBody, IUserDoc, NewRegisteredUser } from "./UserInterface"


class UserService {
  /**
 * Create a user
 * @param {NewCreatedUser} userBody
 * @returns {Promise<IUserDoc>}
 */
  static async createUser(userBody: NewCreatedUser): Promise<IUserDoc> {
    if (await User.isEmailTaken(userBody.email)) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'Email already taken');
    }
    return User.create(userBody);
  };

  /**
   * Register a user
   * @param {NewRegisteredUser} userBody
   * @returns {Promise<IUserDoc>}
   */
  static async registerUser(userBody: NewRegisteredUser): Promise<IUserDoc> {
    if (await User.isEmailTaken(userBody.email)) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'Email already taken');
    }
    return User.create(userBody);
  };

  /**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
  static async queryUsers(filter: Record<string, any>, options: IOptions): Promise<QueryResult> {
    const users = await User.paginate(filter, options);
    return users;
  };


  /**
 * Get user by id
 * @param {mongoose.Types.ObjectId} id
 * @returns {Promise<IUserDoc | null>}
 */
  static async getUserById(id: mongoose.Types.ObjectId): Promise<IUserDoc | null> { return User.findById(id) };

  /**
   * Get user by email
   * @param {string} email
   * @returns {Promise<IUserDoc | null>}
   */
  static async getUserByEmail(email: string): Promise<IUserDoc | null> { return User.findOne({ email }) };

  /**
   * Update user by id
   * @param {mongoose.Types.ObjectId} userId
   * @param {UpdateUserBody} updateBody
   * @returns {Promise<IUserDoc | null>}
   */
  static async updateUserById(
    userId: mongoose.Types.ObjectId,
    updateBody: UpdateUserBody
  ): Promise<IUserDoc | null> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'User not found');
    }
    if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'Email already taken');
    }
    Object.assign(user, updateBody);
    await user.save();
    return user;
  };

  /**
   * Delete user by id
   * @param {mongoose.Types.ObjectId} userId
   * @returns {Promise<IUserDoc | null>}
   */
  static async deleteUserById(userId: mongoose.Types.ObjectId): Promise<IUserDoc | null> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'User not found');
    }
    await user.deleteOne();
    return user;
  };


}

export default UserService;
