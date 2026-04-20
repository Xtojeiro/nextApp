import { AuthConfig } from 'convex/server';
import { clerkAuth } from 'clerk';

export default {
  providers: [clerkAuth as any],
} satisfies AuthConfig;
