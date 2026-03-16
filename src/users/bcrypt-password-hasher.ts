import bcrypt from 'bcryptjs';
import type { PasswordHasher } from './password-hasher.js';

export class BcryptPasswordHasher implements PasswordHasher {
    private readonly saltRounds: number;

    public constructor(saltRounds = 10) {
        this.saltRounds = saltRounds;
    }

    public async hash(plainPassword: string): Promise<string> {
        return bcrypt.hash(plainPassword, this.saltRounds);
    }
}
