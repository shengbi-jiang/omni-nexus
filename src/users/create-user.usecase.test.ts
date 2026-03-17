import { beforeEach, describe, it, expect, vi } from 'vitest';
import {
    CreateUserUseCase,
    type RegisterUserInput,
} from './create-user.usecase.js';
import { User } from './user.entity.js';
import type { UserRepository } from './user.repository.js';
import type { PasswordHasher } from './password-hasher.js';
import { DomainError } from '../common/errors/domain.error.js';

// ---------------------------------------------------------------------------
// Test doubles
// ---------------------------------------------------------------------------

class MockUserRepository implements UserRepository {
    public savedUsers: User[] = [];

    async save(user: User): Promise<void> {
        if (this.savedUsers.some((u) => u.email === user.email)) {
            throw new DomainError(`Email '${user.email}' is already taken.`);
        }
        if (this.savedUsers.some((u) => u.username === user.username)) {
            throw new DomainError(
                `Username '${user.username}' is already taken.`
            );
        }
        this.savedUsers.push(user);
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.savedUsers.find((u) => u.email === email) || null;
    }

    async findByUsername(username: string): Promise<User | null> {
        return this.savedUsers.find((u) => u.username === username) || null;
    }
}

// A thin helper so every test gets a fresh, consistent mock hasher.
const makeMockHasher = (resolvedHash = 'hashed_password'): PasswordHasher => ({
    hash: vi.fn().mockResolvedValue(resolvedHash),
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CreateUserUseCase', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('should hash the plain password and save the user', async () => {
        const mockRepo = new MockUserRepository();
        const mockHasher = makeMockHasher('super_hashed');
        const useCase = new CreateUserUseCase(mockRepo, mockHasher);

        const input: RegisterUserInput = {
            id: '1',
            username: 'username',
            password: 'plainPassword',
            email: 'test@email.com',
        };

        const createdUser = await useCase.execute(input);

        // Verify the hasher was called with the plain-text password
        expect(mockHasher.hash).toHaveBeenCalledWith('plainPassword');
        expect(mockHasher.hash).toHaveBeenCalledTimes(1);

        // Verify the entity stores the hash, not the plain password
        expect(createdUser.passwordHash).toBe('super_hashed');

        // Verify side-effects and returned entity
        expect(mockRepo.savedUsers.length).toBe(1);
        expect(createdUser).toBeDefined();
        expect(createdUser.id).toBe('1');
        expect(createdUser.username).toBe('username');
        expect(createdUser.email).toBe('test@email.com');
        expect(createdUser.createdAt).toBeInstanceOf(Date);
    });

    it('should throw DomainError if email is already taken', async () => {
        const mockRepo = new MockUserRepository();
        const mockHasher = makeMockHasher();
        const useCase = new CreateUserUseCase(mockRepo, mockHasher);

        const input: RegisterUserInput = {
            id: '1',
            username: 'originalUser',
            password: 'password123',
            email: 'duplicate@email.com',
        };

        // Pre-fill the repository
        await useCase.execute(input);

        // Spy on save AFTER pre-fill so we only track the duplicate attempt
        const saveSpy = vi.spyOn(mockRepo, 'save');

        const duplicateInput: RegisterUserInput = {
            id: '2',
            username: 'newUser',
            password: 'password456',
            email: 'duplicate@email.com',
        };

        await expect(useCase.execute(duplicateInput)).rejects.toThrow(
            DomainError
        );
        expect(mockRepo.savedUsers.length).toBe(1);
        expect(saveSpy).not.toHaveBeenCalled();
    });

    it('should throw DomainError if username is already taken', async () => {
        const mockRepo = new MockUserRepository();
        const mockHasher = makeMockHasher();
        const useCase = new CreateUserUseCase(mockRepo, mockHasher);

        const input: RegisterUserInput = {
            id: '1',
            username: 'duplicateUser',
            password: 'password123',
            email: 'first@email.com',
        };

        // Pre-fill
        await useCase.execute(input);

        // Spy on save AFTER pre-fill so we only track the duplicate attempt
        const saveSpy = vi.spyOn(mockRepo, 'save');

        const duplicateInput: RegisterUserInput = {
            id: '2',
            username: 'duplicateUser',
            password: 'password456',
            email: 'second@email.com',
        };

        await expect(useCase.execute(duplicateInput)).rejects.toThrow(
            DomainError
        );
        expect(mockRepo.savedUsers.length).toBe(1);
        expect(saveSpy).not.toHaveBeenCalled();
    });

    it('should throw DomainError from repository save if pre-checks were bypassed (race condition simulation)', async () => {
        const mockRepo = new MockUserRepository();
        const mockHasher = makeMockHasher();
        const useCase = new CreateUserUseCase(mockRepo, mockHasher);

        // Directly push to repository to simulate a concurrent save that happened
        // after our pre-checks but before our own save.
        const existingUser = new User({
            id: '1',
            username: 'user1',
            passwordHash: 'hash',
            email: 'user1@email.com',
        });
        mockRepo.savedUsers.push(existingUser);

        const newInput: RegisterUserInput = {
            id: '2',
            username: 'user2',
            password: 'password',
            email: 'user1@email.com', // Duplicate email
        };

        // Bypass the use case pre-checks to simulate the race
        vi.spyOn(mockRepo, 'findByEmail').mockResolvedValue(null);
        vi.spyOn(mockRepo, 'findByUsername').mockResolvedValue(null);

        await expect(useCase.execute(newInput)).rejects.toThrow(
            `Email 'user1@email.com' is already taken.`
        );
        expect(mockRepo.savedUsers.length).toBe(1);
    });
});
