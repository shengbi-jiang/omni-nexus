export interface CreateUserParams {
    id: string;
    username: string;
    passwordHash: string;
    email: string;
    createdAt?: Date; // Optional, might be generated upon creation
}

export class User {
    private readonly _id: string;
    private _username: string;
    private _passwordHash: string;
    private _email: string;
    private readonly _createdAt: Date;

    public constructor(params: CreateUserParams) {
        this._id = params.id;
        this._username = params.username;
        this._passwordHash = params.passwordHash;
        this._email = params.email;
        this._createdAt = params.createdAt || new Date();
    }

    public get id(): string {
        return this._id;
    }

    public get username(): string {
        return this._username;
    }

    public get passwordHash(): string {
        return this._passwordHash;
    }

    public get email(): string {
        return this._email;
    }

    public get createdAt(): Date {
        return this._createdAt;
    }
}
