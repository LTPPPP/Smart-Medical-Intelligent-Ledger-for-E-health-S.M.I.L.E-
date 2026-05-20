import { Injectable } from '@nestjs/common';

@Injectable()
export class UserSeedService {
  async run() {
    // No-op: user seeding not applicable in this service
  }
}
