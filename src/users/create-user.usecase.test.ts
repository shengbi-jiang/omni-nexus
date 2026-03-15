import { describe, it, expect } from 'vitest';
import { CreateUserUseCase } from './create-user.usecase.js';
import { User, type CreateUserParams } from './user.entity.js';
import type { UserRepository } from './user.repository.js';
import { DomainError } from '../common/errors/domain.error.js';

// We need a fake/mock repository for the usecase to talk to
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

describe('CreateUserUseCase', () => {
    it('should create and save a new user', async () => {
        // 1. Arrange: Setup the dependencies
        const mockRepo = new MockUserRepository();
        const useCase = new CreateUserUseCase(mockRepo);

        const params: CreateUserParams = {
            id: '1',
            username: 'username',
            passwordHash: 'passwordHash',
            email: 'test@email.com',
        };

        // 2. Act: Execute the workflow
        const createdUser = await useCase.execute(params);

        // 3. Assert: Verify side-effects (saved to DB)
        expect(mockRepo.savedUsers.length).toBe(1);

        // 4. Assert: Verify the returned entity
        expect(createdUser).toBeDefined();
        expect(createdUser.id).toBe('1');
        expect(createdUser.username).toBe('username');
        expect(createdUser.email).toBe('test@email.com');
        expect(createdUser.createdAt).toBeInstanceOf(Date);
    });

    it('should throw DomainError if email is already taken', async () => {
        const mockRepo = new MockUserRepository();
        const useCase = new CreateUserUseCase(mockRepo);

        const params: CreateUserParams = {
            id: '1',
            username: 'originalUser',
            passwordHash: 'hash',
            email: 'duplicate@email.com',
        };

        // Pre-fill the repository
        await useCase.execute(params);

        const duplicateParams: CreateUserParams = {
            id: '2',
            username: 'newUser',
            passwordHash: 'hash2',
            email: 'duplicate@email.com',
        };

        await expect(useCase.execute(duplicateParams)).rejects.toThrow(
            DomainError
        );
        expect(mockRepo.savedUsers.length).toBe(1);
    });

    it('should throw DomainError if username is already taken', async () => {
        const mockRepo = new MockUserRepository();
        const useCase = new CreateUserUseCase(mockRepo);

        const params: CreateUserParams = {
            id: '1',
            username: 'duplicateUser',
            passwordHash: 'hash',
            email: 'first@email.com',
        };

        // Pre-fill
        await useCase.execute(params);

        const duplicateParams: CreateUserParams = {
            id: '2',
            username: 'duplicateUser',
            passwordHash: 'hash2',
            email: 'second@email.com',
        };

        await expect(useCase.execute(duplicateParams)).rejects.toThrow(
            DomainError
        );
        expect(mockRepo.savedUsers.length).toBe(1);
    });

    it('should throw DomainError from repository save if pre-checks were bypassed (race condition simulation)', async () => {
        const mockRepo = new MockUserRepository();
        const useCase = new CreateUserUseCase(mockRepo);

        const params: CreateUserParams = {
            id: '1',
            username: 'user1',
            passwordHash: 'hash',
            email: 'user1@email.com',
        };

        // Directly push to repository to simulate a concurrent save that happened after our pre-checks
        // but before our save.
        const existingUser = new User(params);
        mockRepo.savedUsers.push(existingUser);

        const newParams: CreateUserParams = {
            id: '2',
            username: 'user2',
            passwordHash: 'hash',
            email: 'user1@email.com', // Duplicate email
        };

        // The usecase will pass pre-checks if we mock findByEmail to return null,
        // but save() should still catch it.
        mockRepo.findByEmail = async () => null;
        mockRepo.findByUsername = async () => null;

        await expect(useCase.execute(newParams)).rejects.toThrow(
            `Email 'user1@email.com' is already taken.`
        );
        expect(mockRepo.savedUsers.length).toBe(1);
    });
});
