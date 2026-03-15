import { User } from './user.entity.js';
import { type UserRepository } from './user.repository.js';

export class InMemoryUserRepository implements UserRepository {
    private users: User[] = [];

    async save(user: User): Promise<void> {
        this.users.push(user);
    }
}
