# Anthropic Claude - 1M Context Window (Beta)

## Overview

**Feature**: Extended context window up to 1 million tokens
**Status**: Beta (as of 2025-08-07)
**Model**: claude-sonnet-4-5
**Requirement**: Special beta header in API requests

## Description

The 1M context window beta allows processing of extremely large documents or conversations with Claude. This is a significant increase from the standard 200K context window.

## Use Cases

- Processing entire codebases
- Analyzing very long documents (books, research papers, legal documents)
- Maintaining extended conversation history
- Multi-document analysis in a single context
- Large-scale data analysis

## API Usage

### Python (Anthropic SDK)

```python
from anthropic import Anthropic

client = Anthropic()

response = client.beta.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Process this large document..."}
    ],
    betas=["context-1m-2025-08-07"]
)
```

### Key Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| `model` | `claude-sonnet-4-5` | The model that supports 1M context |
| `betas` | `["context-1m-2025-08-07"]` | Beta feature header (required) |
| `max_tokens` | Up to model limit | Maximum tokens for response |
| `messages` | Array of messages | Conversation history and input |

## Important Notes

### Beta Header
```python
betas=["context-1m-2025-08-07"]
```
- **Required** to access the 1M context window
- Date suffix indicates the API version
- Must be included in every request using extended context

### Pricing Considerations

⚠️ **Important**: Extended context window may have different pricing:
- Input tokens: Check current pricing for 1M context
- Output tokens: Standard pricing applies
- Prompt caching: Highly recommended for large contexts
  - Cache creation: ~90% cost reduction on repeated reads
  - Cache hits: Significant savings on subsequent requests

### Prompt Caching Recommendation

For 1M context usage, **always** use prompt caching:

```python
from anthropic import Anthropic

client = Anthropic()

response = client.beta.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=1024,
    system=[
        {
            "type": "text",
            "text": "Large system prompt or document...",
            "cache_control": {"type": "ephemeral"}
        }
    ],
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Very large document content...",
                    "cache_control": {"type": "ephemeral"}
                }
            ]
        },
        {"role": "user", "content": "Question about the document"}
    ],
    betas=["context-1m-2025-08-07", "prompt-caching-2024-07-31"]
)
```

### Performance Tips

1. **Use Prompt Caching**: Essential for cost-effective 1M context usage
2. **Structure Content**: Place large static content early in the conversation
3. **Mark Cacheable Blocks**: Use `cache_control` on large, reusable content
4. **Monitor Token Usage**: Track input/output tokens and cache hits
5. **Optimize Context**: Include only necessary information even with 1M available

## Token Calculation

Example token counts for reference:
- Average English word: ~1.3 tokens
- 1M tokens ≈ 750,000 English words
- 1M tokens ≈ 3,000+ pages of text
- Entire codebase: Medium-large projects fit within 1M

## Error Handling

```python
from anthropic import Anthropic, APIError

client = Anthropic()

try:
    response = client.beta.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1024,
        messages=[{"role": "user", "content": "..."}],
        betas=["context-1m-2025-08-07"]
    )
except APIError as e:
    if "context window" in str(e).lower():
        print("Content exceeds 1M token limit")
    elif "beta" in str(e).lower():
        print("Beta feature not available or header incorrect")
    else:
        raise
```

## Comparison with Standard Context

| Feature | Standard | 1M Beta |
|---------|----------|---------|
| Context Window | 200K tokens | 1M tokens |
| Model | claude-sonnet-4-5 | claude-sonnet-4-5 |
| Beta Header | Not required | **Required** |
| Prompt Caching | Recommended | **Essential** |
| Use Case | Standard conversations | Large document processing |

## Migration Example

### Before (Standard 200K)
```python
response = client.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Short content..."}]
)
```

### After (1M Beta)
```python
response = client.beta.messages.create(  # .beta instead of standard
    model="claude-sonnet-4-5",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Very large content..."}],
    betas=["context-1m-2025-08-07"]  # Required header
)
```

## Best Practices

### ✅ Do's
- Use prompt caching for large static content
- Structure content with cacheable blocks early
- Monitor token usage and costs
- Test with smaller contexts first
- Include the beta header in all requests
- Use for genuinely large content needs

### ❌ Don'ts
- Don't use 1M context for small tasks (unnecessary cost)
- Don't forget the beta header (request will fail)
- Don't skip prompt caching (very expensive without it)
- Don't exceed 1M tokens (will error)
- Don't use deprecated beta header dates

## Related Features

- **Prompt Caching**: `betas=["prompt-caching-2024-07-31"]`
- **Extended Thinking**: For claude-sonnet-4 models
- **Batch API**: For non-real-time large workloads

## Resources

- Anthropic API Documentation: https://docs.anthropic.com/
- Prompt Caching Guide: https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
- Token Counting: https://www.anthropic.com/claude/tokenizer

## Status & Updates

**Current Beta Version**: `context-1m-2025-08-07`
**Last Updated**: 2025-10-27
**Status**: Active Beta - Header required for access

⚠️ **Note**: As a beta feature, the API may change. Monitor Anthropic's changelog for updates to the beta header version.

---

**Use Case Examples:**

1. **Codebase Analysis**: Load entire repository for architecture review
2. **Book Analysis**: Process complete novels or technical books
3. **Legal Documents**: Review multi-hundred-page contracts
4. **Research Papers**: Analyze multiple papers in single context
5. **Chat History**: Maintain very long conversation threads
6. **Multi-Document QA**: Query across many documents simultaneously
