/**
 * Debug utilities for development and testing
 * These help generate test data and debug the app
 */

import { createTestData } from './testDataSetup';

// Make this globally available for console access
declare global {
  var debugHabits: {
    createTestData: () => Promise<void>;
  };
}

// Expose debug functions to global scope for console access
if (typeof globalThis !== 'undefined') {
  globalThis.debugHabits = {
    createTestData,
  };
}

export { createTestData };
