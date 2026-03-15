import { User } from './user.entity.js';

export interface UserRepository {
    save(user: User): Promise<void>;
}
