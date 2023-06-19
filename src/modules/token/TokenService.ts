import jwt from 'jsonwebtoken';
import moment, { Moment } from 'moment';
import Token from './Token';
import config from '@/config/config';
import { HttpStatus, ApiError } from '@/utils';
import { tokenTypes } from '@/config/tokens';
import UserService from '@/modules/user/UserService';
import { IUserDoc } from '@/modules/user/UserInterface';

class TokenService {
    /**
     * Generate token
     * @param {mongoose.Types.ObjectId} userId
     * @param {Moment} expires
     * @param {string} type
     * @param {string} [secret]
     * @returns {string}
     */
    static generateToken(userId, expires, type, secret = config.jwt.secret) {
        const payload = {
            sub: userId,
            iat: moment().unix(),
            exp: expires.unix(),
            type,
        };
        return jwt.sign(payload, secret);
    }

    /**
     * Save a token
     * @param {string} token
     * @param {mongoose.Types.ObjectId} userId
     * @param {Moment} expires
     * @param {string} type
     * @param {boolean} [blacklisted]
     * @returns {Promise<ITokenDoc>}
     */
    static async saveToken(token, userId, expires, type, blacklisted = false) {
        const tokenDoc = await Token.create({
            token,
            user: userId,
            expires: expires.toDate(),
            type,
            blacklisted,
        });
        return tokenDoc;
    }

    /**
     * Verify token and return token doc (or throw an error if it is not valid)
     * @param {string} token
     * @param {string} type
     * @returns {Promise<ITokenDoc>}
     */
    static async verifyToken(token, type) {
        const payload = jwt.verify(token, config.jwt.secret);
        if (typeof payload.sub !== 'string') {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'bad user');
        }
        const tokenDoc = await Token.findOne({
            token,
            type,
            user: payload.sub,
            blacklisted: false,
        });
        if (!tokenDoc) {
            throw new Error('Token not found');
        }
        return tokenDoc;
    }

    /**
     * Generate auth tokens
     * @param {IUserDoc} user
     * @returns {Promise<AccessAndRefreshTokens>}
     */
    static async generateAuthTokens(user) {
        const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
        const accessToken = this.generateToken(user.id, accessTokenExpires, tokenTypes.ACCESS);

        const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
        const refreshToken = this.generateToken(user.id, refreshTokenExpires, tokenTypes.REFRESH);
        await this.saveToken(refreshToken, user.id, refreshTokenExpires, tokenTypes.REFRESH);

        return {
            access: {
                token: accessToken,
                expires: accessTokenExpires.toDate(),
            },
            refresh: {
                token: refreshToken,
                expires: refreshTokenExpires.toDate(),
            },
        };
    }

    /**
     * Generate reset password token
     * @param {string} email
     * @returns {Promise<string>}
     */
    static async generateResetPasswordToken(email: string): Promise<string> {
        const user = await UserService.getUserByEmail(email);
        if (!user) {
            throw new ApiError(HttpStatus.NO_CONTENT, '');
        }
        const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
        const resetPasswordToken = this.generateToken(user.id, expires, tokenTypes.RESET_PASSWORD);
        await this.saveToken(resetPasswordToken, user.id, expires, tokenTypes.RESET_PASSWORD);
        return resetPasswordToken;
    };


    /**
* Generate verify email token
* @param {IUserDoc} user
* @returns {Promise<string>}
*/
    static async generateVerifyEmailToken(user: IUserDoc): Promise<string> {
        const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
        const verifyEmailToken = this.generateToken(user.id, expires, tokenTypes.VERIFY_EMAIL);
        await this.saveToken(verifyEmailToken, user.id, expires, tokenTypes.VERIFY_EMAIL);
        return verifyEmailToken;
    };
}

export default TokenService;