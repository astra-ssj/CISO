/**
 * AI Provider Index
 * Import this file to register all providers
 */

// Core interface and factory
export * from './ai-provider';

// Provider implementations (auto-register on import)
import './mock-provider';
import './openai-provider';
import './anthropic-provider';
import './google-provider';
