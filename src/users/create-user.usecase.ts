import { User, type CreateUserParams } from './user.entity.js';
import { type UserRepository } from './user.repository.js';

export class CreateUserUseCase {
    public constructor(private readonly userRepository: UserRepository) {}

    public async execute(params: CreateUserParams): Promise<User> {
        const user = new User(params);
        await this.userRepository.save(user);
        return user;
    }
}
