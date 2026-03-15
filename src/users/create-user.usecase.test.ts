import { describe, it, expect } from 'vitest';
import { CreateUserUseCase } from './create-user.usecase.js';
import { User, type CreateUserParams } from './user.entity.js';

// We need a fake/mock repository for the usecase to talk to
class MockUserRepository {
    public savedUsers: User[] = [];

    async save(user: User): Promise<void> {
        this.savedUsers.push(user);
    }
}

describe('CreateUserUseCase', () => {
    it('should create and save a new user', async () => {
        // 1. Arrange: Setup the dependencies
        const mockRepo = new MockUserRepository();
        const useCase = new CreateUserUseCase(mockRepo);

        const params = {
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
});
