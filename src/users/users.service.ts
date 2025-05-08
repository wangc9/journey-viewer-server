import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { User } from './users.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async getUserCount(): Promise<number> {
    const cacheKey = 'users:count';
    const cache: string | null = await this.cacheManager.get(cacheKey);

    if (cache) {
      return Number(cache);
    } else {
      const count = await this.userRepository.count();
      await this.cacheManager.set(cacheKey, count, 3.6e6);
      return count;
    }
  }

  async getAllUsers(skip: number, take: number): Promise<User[] | null> {
    const cacheKey = `users:skip=${skip}&take=${take}`;
    const cache: string | null = await this.cacheManager.get(cacheKey);

    if (cache) {
      return JSON.parse(cache) as User[] | null;
    } else {
      const result = await this.userRepository.find({
        skip: take === -1 ? skip : skip * take,
        take: take === -1 ? undefined : take,
      });
      await this.cacheManager.set(cacheKey, JSON.stringify(result), 3.6e6);
      return result;
    }
  }

  async getSingleUser(email: string): Promise<User | null> {
    const cacheKey = `user:email=${email}`;
    const cache: string | null = await this.cacheManager.get(cacheKey);

    if (cache) {
      return JSON.parse(cache) as User | null;
    } else {
      const result = await this.userRepository.findOne({ where: { email } });
      if (result) {
        await this.cacheManager.set(cacheKey, JSON.stringify(result), 3.6e6);
      }
      return result;
    }
  }

  async createUser(email: string, password: string): Promise<User | null> {
    const soltOrRounds = 10;
    const hashedPassword = await bcrypt.hash(password, soltOrRounds);

    const user = this.userRepository.create({
      email,
      password: hashedPassword,
    });
    const savedUser = await this.userRepository.save(user);

    return savedUser;
  }
}
