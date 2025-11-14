import type { ClonerOptions, RateLimitConfig } from '../types/index.js';

export const defaultClonerOptions: ClonerOptions = {
  cloneGuilds: true,
  cloneChannels: true,
  cloneRoles: true,
  cloneEmojis: true,
  cloneBans: false,
  cloneVoiceStates: false,
};

export const defaultRateLimitConfig: RateLimitConfig = {
  delay: 0, // No delay for fast cloning
  maxConcurrentRequests: 50, // Maximum concurrency for extreme speed
};

