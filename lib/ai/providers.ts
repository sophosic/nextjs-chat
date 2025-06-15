import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';

// Custom agent provider configuration
const customAgentProvider = createOpenAICompatible({
  name: process.env.CUSTOM_AGENT_PROVIDER_NAME || 'custom-agent',
  apiKey: process.env.CUSTOM_AGENT_API_KEY || 'dummy-key',
  baseURL: process.env.CUSTOM_AGENT_BASE_URL || 'http://localhost:8000/v1',
  headers: process.env.CUSTOM_AGENT_HEADERS
    ? JSON.parse(process.env.CUSTOM_AGENT_HEADERS)
    : {},
});

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        // Map model IDs to custom agent models
        'chat-model': customAgentProvider(
          process.env.CUSTOM_AGENT_CHAT_MODEL || 'gpt-4o-mini',
        ),
        'chat-model-reasoning': wrapLanguageModel({
          model: customAgentProvider(
            process.env.CUSTOM_AGENT_REASONING_MODEL || 'gpt-4o',
          ),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': customAgentProvider(
          process.env.CUSTOM_AGENT_TITLE_MODEL || 'gpt-3.5-turbo',
        ),
        'artifact-model': customAgentProvider(
          process.env.CUSTOM_AGENT_ARTIFACT_MODEL || 'gpt-4o',
        ),
      },
      // Note: Image models are commented out as they require special configuration
      // Uncomment and configure if your custom agent supports image generation
      // imageModels: {
      //   'small-model': customAgentProvider.imageModel('dall-e-3'),
      // },
    });
