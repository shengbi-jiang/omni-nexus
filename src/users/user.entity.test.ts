import { describe, it, expect } from 'vitest';
import { User, type CreateUserParams } from './user.entity.js';

describe('User entity', () => {
    it('should create a new user', () => {
        const parameters: CreateUserParams = {
            id: '1',
            username: 'test',
            passwordHash: 'test',
            email: 'test',
        };

        const user = new User(parameters);
        expect(user).toBeInstanceOf(User);
    });

    it('should have the correct properties', () => {
        const createdAt = new Date();
        const parameters: CreateUserParams = {
            id: '1',
            username: 'test',
            passwordHash: 'test',
            email: 'test',
            createdAt: createdAt,
        };

        const user = new User(parameters);
        expect(user.id).toBe('1');
        expect(user.username).toBe('test');
        expect(user.passwordHash).toBe('test');
        expect(user.email).toBe('test');
        expect(user.createdAt).toBe(createdAt);
    });

    it('should use the current date if no creation date is provided', () => {
        const parameters: CreateUserParams = {
            id: '1',
            username: 'test',
            passwordHash: 'test',
            email: 'test',
        };

        const user = new User(parameters);
        expect(user.createdAt).toBeInstanceOf(Date);
    });
});
