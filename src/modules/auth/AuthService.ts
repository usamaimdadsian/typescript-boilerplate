import mongoose from 'mongoose';


import { ApiError, HttpStatus } from '@/utils';

import Token from '@/modules/token/Token';
import { tokenTypes } from '@/config/tokens';

import { IUserDoc, IUserWithTokens } from '@/modules/user/UserInterface';
import TokenService from '@/modules/token/TokenService';
import UserService from '@/modules/user/UserService';


class AuthService {

  /**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<IUserDoc>}
 */
  static async loginUserWithEmailAndPassword(email: string, password: string): Promise<IUserDoc> {
    const user = await UserService.getUserByEmail(email);
    if (!user || !(await user.isPasswordMatch(password))) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, 'Incorrect email or password');
    }
    return user;
  };

  /**
   * Logout
   * @param {string} refreshToken
   * @returns {Promise<void>}
   */
  static async logout(refreshToken: string): Promise<void> {
    const refreshTokenDoc = await Token.findOne({ token: refreshToken, type: tokenTypes.REFRESH, blacklisted: false });
    if (!refreshTokenDoc) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Not found');
    }
    await refreshTokenDoc.deleteOne();
  };

  /**
   * Refresh auth tokens
   * @param {string} refreshToken
   * @returns {Promise<IUserWithTokens>}
   */
  static async refreshAuth(refreshToken: string): Promise<IUserWithTokens> {
    try {
      const refreshTokenDoc = await TokenService.verifyToken(refreshToken, tokenTypes.REFRESH);
      const user = await UserService.getUserById(new mongoose.Types.ObjectId(refreshTokenDoc.user));
      if (!user) {
        throw new Error();
      }
      await refreshTokenDoc.deleteOne();
      const tokens = await TokenService.generateAuthTokens(user);
      return { user, tokens };
    } catch (error) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, 'Please authenticate');
    }
  };

  /**
   * Reset password
   * @param {string} resetPasswordToken
   * @param {string} newPassword
   * @returns {Promise<void>}
   */
  static async resetPassword(resetPasswordToken: any, newPassword: string): Promise<void> {
    try {
      const resetPasswordTokenDoc = await TokenService.verifyToken(resetPasswordToken, tokenTypes.RESET_PASSWORD);
      const user = await UserService.getUserById(new mongoose.Types.ObjectId(resetPasswordTokenDoc.user));
      if (!user) {
        throw new Error();
      }
      await UserService.updateUserById(user.id, { password: newPassword });
      await Token.deleteMany({ user: user.id, type: tokenTypes.RESET_PASSWORD });
    } catch (error) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, 'Password reset failed');
    }
  };

  /**
   * Verify email
   * @param {string} verifyEmailToken
   * @returns {Promise<IUserDoc | null>}
   */
  static async verifyEmail(verifyEmailToken: any): Promise<IUserDoc | null> {
    try {
      const verifyEmailTokenDoc = await TokenService.verifyToken(verifyEmailToken, tokenTypes.VERIFY_EMAIL);
      const user = await UserService.getUserById(new mongoose.Types.ObjectId(verifyEmailTokenDoc.user));
      if (!user) {
        throw new Error();
      }
      await Token.deleteMany({ user: user.id, type: tokenTypes.VERIFY_EMAIL });
      const updatedUser = await UserService.updateUserById(user.id, { isEmailVerified: true });
      return updatedUser;
    } catch (error) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, 'Email verification failed');
    }
  };
}

export default AuthService;
