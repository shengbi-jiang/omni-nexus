import { User } from './user.entity.js';
import { type UserRepository } from './user.repository.js';
import { DomainError } from '../common/errors/domain.error.js';

export class InMemoryUserRepository implements UserRepository {
    private users: User[] = [];

    async save(user: User): Promise<void> {
        if (this.users.some(u => u.email === user.email)) {
            throw new DomainError(`Email '${user.email}' is already taken.`);
        }
        if (this.users.some(u => u.username === user.username)) {
            throw new DomainError(`Username '${user.username}' is already taken.`);
        }
        this.users.push(user);
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.users.find(u => u.email === email) || null;
    }

    async findByUsername(username: string): Promise<User | null> {
        return this.users.find(u => u.username === username) || null;
    }
}
