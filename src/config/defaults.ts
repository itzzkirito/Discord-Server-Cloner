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
  delay: 1000,
  maxConcurrentRequests: 5,
};

