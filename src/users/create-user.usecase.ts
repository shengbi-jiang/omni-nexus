import { User, type CreateUserParams } from './user.entity.js';
import { type UserRepository } from './user.repository.js';
import { DomainError } from '../common/errors/domain.error.js';

export class CreateUserUseCase {
    public constructor(private readonly userRepository: UserRepository) {}

    public async execute(params: CreateUserParams): Promise<User> {
        const existingEmail = await this.userRepository.findByEmail(params.email);
        if (existingEmail) {
            throw new DomainError(`Email '${params.email}' is already taken.`);
        }

        const existingUsername = await this.userRepository.findByUsername(params.username);
        if (existingUsername) {
            throw new DomainError(`Username '${params.username}' is already taken.`);
        }

        const user = new User(params);
        await this.userRepository.save(user);
        return user;
    }
}
