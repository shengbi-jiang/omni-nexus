import { User } from './user.entity.js';
import { type UserRepository } from './user.repository.js';
import { type PasswordHasher } from './password-hasher.js';
import { DomainError } from '../common/errors/domain.error.js';

export interface RegisterUserInput {
    id: string;
    username: string;
    email: string;
    password: string; // plain-text — will be hashed before the entity is created
}

export class CreateUserUseCase {
    public constructor(
        private readonly userRepository: UserRepository,
        private readonly passwordHasher: PasswordHasher
    ) {}

    public async execute(input: RegisterUserInput): Promise<User> {
        const [existingEmail, existingUsername] = await Promise.all([
            this.userRepository.findByEmail(input.email),
            this.userRepository.findByUsername(input.username),
        ]);

        if (existingEmail) {
            throw new DomainError(`Email '${input.email}' is already taken.`);
        }

        if (existingUsername) {
            throw new DomainError(
                `Username '${input.username}' is already taken.`
            );
        }

        // Hash only after the fast-fail pre-checks pass — no point doing
        // expensive crypto if we're going to throw anyway.
        const passwordHash = await this.passwordHasher.hash(input.password);

        const user = new User({
            id: input.id,
            username: input.username,
            email: input.email,
            passwordHash,
        });

        await this.userRepository.save(user);
        return user;
    }
}
