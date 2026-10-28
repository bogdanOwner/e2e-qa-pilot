import { defineConfig } from '@playwright/test';
import { createConfig } from './playwright.shared.mjs';

export default defineConfig(createConfig());
