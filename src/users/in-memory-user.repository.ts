import { User } from './user.entity.js';
import { type UserRepository } from './user.repository.js';

export class InMemoryUserRepository implements UserRepository {
    private users: User[] = [];

    async save(user: User): Promise<void> {
        this.users.push(user);
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.users.find(u => u.email === email) || null;
    }

    async findByUsername(username: string): Promise<User | null> {
        return this.users.find(u => u.username === username) || null;
    }
}
