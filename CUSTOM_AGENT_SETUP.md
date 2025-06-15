# Custom Agent Backend Integration Setup Guide

This guide will help you set up the Vercel AI chatbot interface to work with your custom agent backend.

## Overview

The chatbot has been modified to use an OpenAI-compatible provider that can connect to any custom agent backend that implements the OpenAI API format.

## Prerequisites

1. **Custom Agent Backend**: Your backend should implement OpenAI-compatible endpoints:

   - `POST /v1/chat/completions` - For chat completions
   - `POST /v1/images/generations` - For image generation (optional)
   - Standard OpenAI request/response format

2. **Environment Variables**: Configure your environment with the custom backend details

## Step-by-Step Setup

### 1. Environment Configuration

Copy the example configuration and create your `.env.local` file:

```bash
cp env.example.custom .env.local
```

Edit `.env.local` with your custom agent backend details:

```bash
# Required: Custom Agent Backend Configuration
CUSTOM_AGENT_API_KEY=your-actual-api-key
CUSTOM_AGENT_BASE_URL=http://localhost:8000/v1
# Or: https://your-custom-agent-api.com/v1

# Required: Database Configuration
POSTGRES_URL=your-postgres-connection-string

# Required: Authentication Secret
AUTH_SECRET=your-secure-random-string

# Optional: Model Mapping (defaults provided)
CUSTOM_AGENT_CHAT_MODEL=gpt-4o-mini
CUSTOM_AGENT_REASONING_MODEL=gpt-4o
CUSTOM_AGENT_TITLE_MODEL=gpt-3.5-turbo
CUSTOM_AGENT_ARTIFACT_MODEL=gpt-4o

# Optional: Additional Headers (JSON format)
CUSTOM_AGENT_HEADERS={"X-Custom-Header": "value"}

# Optional: Provider Name (for debugging)
CUSTOM_AGENT_PROVIDER_NAME=custom-agent
```

### 2. Database Setup

Set up your PostgreSQL database:

```bash
# Generate database schema
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Or push schema directly (for development)
pnpm db:push
```

### 3. Install Dependencies

All required dependencies have been installed. If you need to reinstall:

```bash
pnpm install
```

### 4. Custom Agent Backend Requirements

Your custom agent backend must support:

#### Required Endpoints:

**Chat Completions** (`POST /v1/chat/completions`):

```json
{
  "model": "your-model-name",
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "Hello!" }
  ],
  "stream": true,
  "max_tokens": 4000,
  "temperature": 0.7
}
```

**Expected Response** (streaming):

```
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"your-model","choices":[{"index":0,"delta":{"role":"assistant","content":"Hello"},"finish_reason":null}]}

data: [DONE]
```

#### Optional Features:

**Tool Calling Support**: If your backend supports function calling:

```json
{
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Get weather information",
        "parameters": {"type": "object", "properties": {...}}
      }
    }
  ],
  "tool_choice": "auto"
}
```

**Image Generation** (`POST /v1/images/generations`):

```json
{
  "prompt": "A beautiful sunset",
  "n": 1,
  "size": "1024x1024"
}
```

### 5. Testing the Integration

Start the development server:

```bash
pnpm dev
```

Visit `http://localhost:3000` and:

1. **Test Basic Chat**: Send a simple message
2. **Test Streaming**: Verify responses stream properly
3. **Test Tools**: Try weather queries or document creation
4. **Test Reasoning**: Use the reasoning model for complex queries

### 6. Model Configuration

The chatbot uses these model mappings:

- **`chat-model`**: Primary conversational model
- **`chat-model-reasoning`**: Advanced reasoning with thinking tags
- **`title-model`**: Generates chat titles
- **`artifact-model`**: Creates and updates documents

Map these to your backend's available models in the environment variables.

### 7. Troubleshooting

#### Common Issues:

**Connection Errors**:

- Verify `CUSTOM_AGENT_BASE_URL` is correct and accessible
- Check if your backend is running
- Ensure API key is valid

**Model Not Found**:

- Verify model names in environment variables match your backend
- Check your backend's available models endpoint

**Streaming Issues**:

- Ensure your backend supports streaming responses
- Check CORS configuration if running locally

**Tool Calling Problems**:

- Verify your backend supports OpenAI-compatible function calling
- Check tool definitions in `lib/ai/tools/` directory

#### Debug Mode:

Enable debug logging by setting:

```bash
NODE_ENV=development
DEBUG=ai:*
```

### 8. Advanced Configuration

#### Custom Headers:

```bash
CUSTOM_AGENT_HEADERS='{"Authorization": "Bearer additional-token", "X-Custom": "value"}'
```

#### Multiple Backends:

For different models on different backends, modify `lib/ai/providers.ts`:

```typescript
const chatProvider = createOpenAICompatible({
  baseURL: process.env.CHAT_BACKEND_URL,
  apiKey: process.env.CHAT_API_KEY,
});

const reasoningProvider = createOpenAICompatible({
  baseURL: process.env.REASONING_BACKEND_URL,
  apiKey: process.env.REASONING_API_KEY,
});
```

#### Custom Error Handling:

Implement custom error handling in your provider configuration for backend-specific error formats.

## Next Steps

1. **Deploy to Production**: Use Vercel or your preferred platform
2. **Monitor Usage**: Implement logging and monitoring
3. **Scale Backend**: Ensure your custom agent can handle production load
4. **Add Features**: Extend functionality with additional tools or models

## Support

- Check the AI SDK documentation: https://sdk.vercel.ai/docs
- Review OpenAI API compatibility: https://platform.openai.com/docs/api-reference
- Test your backend with curl or Postman before integration

## Example Custom Agent Backend

Here's a minimal Python FastAPI example for reference:

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import json

app = FastAPI()

@app.post("/v1/chat/completions")
async def chat_completions(request: dict):
    if request.get("stream"):
        return StreamingResponse(
            generate_stream_response(request),
            media_type="text/plain"
        )
    else:
        return generate_response(request)

def generate_stream_response(request):
    # Your streaming logic here
    for chunk in your_model_stream(request["messages"]):
        data = {
            "choices": [{"delta": {"content": chunk}}]
        }
        yield f"data: {json.dumps(data)}\n\n"
    yield "data: [DONE]\n\n"
```

This setup provides a robust foundation for integrating any OpenAI-compatible custom agent backend with the Vercel AI chatbot interface.
