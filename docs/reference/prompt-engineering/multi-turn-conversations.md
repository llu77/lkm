# Multi-turn Conversations with Claude

## Overview

Multi-turn conversations allow Claude to maintain context across multiple exchanges by passing the full conversation history in the messages array. Each turn includes both user messages and Claude's previous responses, enabling coherent dialogues and iterative refinement.

## Core Concept

The Anthropic API uses a messages array where each message has a role (user or assistant) and content. To maintain conversation context, include all previous exchanges in subsequent API calls.

## Basic Pattern

```python
# First turn
messages = [
    {
        "role": "user",
        "content": "Your initial question or task"
    }
]

first_response = get_completion(messages)

# Second turn - includes first response
messages = [
    {
        "role": "user",
        "content": "Your initial question or task"
    },
    {
        "role": "assistant",
        "content": first_response
    },
    {
        "role": "user",
        "content": "Follow-up question or refinement"
    }
]

second_response = get_completion(messages)
```

## Example 1: Word List Refinement

### Initial Request

```python
first_user = "Name ten words that all end with the exact letters 'ab'."

messages = [
    {
        "role": "user",
        "content": first_user
    }
]

first_response = get_completion(messages)
print(first_response)
```

### Follow-up Without Context

When asking Claude to find replacements for non-real words without proper guidance:

```python
second_user = "Please find replacements for all 'words' that are not real words."

messages = [
    {
        "role": "user",
        "content": first_user
    },
    {
        "role": "assistant",
        "content": first_response
    },
    {
        "role": "user",
        "content": second_user
    }
]

print(get_completion(messages))
```

**Problem:** Claude might unnecessarily replace valid words.

### Improved Follow-up with Guard Clause

```python
second_user = "Please find replacements for all 'words' that are not real words. If all the words are real words, return the original list."

messages = [
    {
        "role": "user",
        "content": first_user
    },
    {
        "role": "assistant",
        "content": first_response
    },
    {
        "role": "user",
        "content": second_user
    }
]

print(get_completion(messages))
```

**Solution:** Adding a guard clause prevents unnecessary changes when the list is already correct.

### Using Hardcoded Response for Consistency

```python
first_user = "Name ten words that all end with the exact letters 'ab'."

first_response = """Here are 10 words that end with the letters 'ab':

1. Cab
2. Dab
3. Grab
4. Gab
5. Jab
6. Lab
7. Nab
8. Slab
9. Tab
10. Blab"""

second_user = "Please find replacements for all 'words' that are not real words."

messages = [
    {
        "role": "user",
        "content": first_user
    },
    {
        "role": "assistant",
        "content": first_response
    },
    {
        "role": "user",
        "content": second_user
    }
]

print(get_completion(messages))
```

**Technique:** Hardcoding Claude's first response ensures consistent testing and validation scenarios.

## Example 2: Iterative Story Improvement

### Initial Story Generation

```python
first_user = "Write a three-sentence short story about a girl who likes to run."

messages = [
    {
        "role": "user",
        "content": first_user
    }
]

first_response = get_completion(messages)
print(first_response)
```

### Vague Improvement Request

```python
second_user = "Make the story better."

messages = [
    {
        "role": "user",
        "content": first_user
    },
    {
        "role": "assistant",
        "content": first_response
    },
    {
        "role": "user",
        "content": second_user
    }
]

print(get_completion(messages))
```

**Note:** "Make it better" is subjective but Claude will interpret based on context and general writing principles.

## Example 3: Multi-step Data Extraction with Prefill

### Initial Extraction

```python
first_user = """Find all names from the below text:

"Hey, Jesse. It's me, Erin. I'm calling about the party that Joey is throwing tomorrow. Keisha said she would come and I think Mel will be there too."""

prefill = ""

messages = [
    {
        "role": "user",
        "content": first_user
    },
    {
        "role": "assistant",
        "content": prefill
    }
]

first_response = get_completion(messages)
print(first_response)
```

### Follow-up Processing with Prefill Continuation

```python
second_user = "Alphabetize the list."

messages = [
    {
        "role": "user",
        "content": first_user
    },
    {
        "role": "assistant",
        "content": prefill + "\n" + first_response
    },
    {
        "role": "user",
        "content": second_user
    }
]

print(get_completion(messages))
```

**Technique:** Concatenating prefill with previous response maintains the full assistant turn context.

## Key Patterns and Best Practices

### 1. Message Array Structure

Every API call must include the complete conversation history up to that point:

```python
messages = [
    {"role": "user", "content": "Turn 1 user"},
    {"role": "assistant", "content": "Turn 1 assistant"},
    {"role": "user", "content": "Turn 2 user"},
    {"role": "assistant", "content": "Turn 2 assistant"},
    {"role": "user", "content": "Turn 3 user"}
]
```

### 2. Alternating Roles

Messages must alternate between user and assistant roles. Cannot have consecutive messages with the same role.

### 3. Prefill Continuation

When using prefill in multi-turn conversations, concatenate it with Claude's actual response:

```python
# First turn with prefill
messages = [
    {"role": "user", "content": prompt},
    {"role": "assistant", "content": prefill}
]
response = get_completion(messages)

# Second turn
messages.append({"role": "assistant", "content": prefill + response})
messages.append({"role": "user", "content": follow_up})
```

### 4. Hardcoded Responses for Testing

Use hardcoded assistant responses to ensure consistent test scenarios:

```python
first_response = """Known good output..."""

messages = [
    {"role": "user", "content": initial_prompt},
    {"role": "assistant", "content": first_response},
    {"role": "user", "content": refinement_prompt}
]
```

### 5. Guard Clauses in Follow-ups

Add explicit instructions for edge cases:

```python
"If all items are valid, return the original list."
"If no changes are needed, say 'No improvements necessary.'"
"Only modify if X condition is met."
```

### 6. Context Pruning

For very long conversations, consider:
- Keeping only relevant recent turns
- Summarizing older context
- Using system prompts to maintain key information
- Monitoring token usage

## Common Use Cases

### Iterative Refinement
```python
"Write a function..."
→ "Add error handling..."
→ "Add type hints..."
→ "Optimize for performance..."
```

### Data Extraction Pipeline
```python
"Extract all dates from the text..."
→ "Convert them to ISO format..."
→ "Sort them chronologically..."
```

### Creative Collaboration
```python
"Write a poem about..."
→ "Make it more melancholic..."
→ "Add a metaphor about..."
```

### Classification and Correction
```python
"Classify these emails..."
→ "Fix any misclassifications..."
→ "Explain your reasoning..."
```

## API Helper Function

```python
import anthropic

client = anthropic.Anthropic(api_key=API_KEY)

def get_completion(messages, system_prompt="", max_tokens=2000, temperature=0.0):
    """
    Get completion from Claude with conversation history.

    Args:
        messages: List of message dicts with 'role' and 'content'
        system_prompt: Optional system prompt
        max_tokens: Maximum tokens in response
        temperature: Randomness (0.0 = deterministic)

    Returns:
        String containing Claude's response
    """
    response = client.messages.create(
        model=MODEL_NAME,
        max_tokens=max_tokens,
        temperature=temperature,
        system=system_prompt,
        messages=messages
    )
    return response.content[0].text
```

## Token Management

Multi-turn conversations accumulate tokens quickly:

```python
# Track conversation token usage
total_tokens = 0

for turn in conversation:
    response = get_completion(messages)
    total_tokens += count_tokens(messages) + count_tokens(response)

    if total_tokens > token_limit:
        # Prune older messages or summarize
        messages = prune_messages(messages)
```

## Error Handling

```python
try:
    response = get_completion(messages)
    messages.append({
        "role": "assistant",
        "content": response
    })
except anthropic.APIError as e:
    print(f"API Error: {e}")
    # Handle retry logic or conversation reset
```

## Stateful Conversation Management

```python
class ConversationManager:
    def __init__(self, system_prompt=""):
        self.messages = []
        self.system_prompt = system_prompt

    def add_user_message(self, content):
        self.messages.append({
            "role": "user",
            "content": content
        })

    def get_response(self):
        response = get_completion(
            self.messages,
            system_prompt=self.system_prompt
        )
        self.messages.append({
            "role": "assistant",
            "content": response
        })
        return response

    def reset(self):
        self.messages = []

# Usage
conv = ConversationManager(system_prompt="You are a helpful assistant.")
conv.add_user_message("Hello!")
print(conv.get_response())
conv.add_user_message("Tell me a joke.")
print(conv.get_response())
```

## Best Practices Summary

1. **Always include full conversation history** in the messages array
2. **Alternate roles** properly (user/assistant/user/...)
3. **Use guard clauses** to handle edge cases in follow-up prompts
4. **Hardcode responses** when testing specific conversation flows
5. **Concatenate prefill** with responses for proper context
6. **Monitor token usage** and prune when necessary
7. **Use explicit instructions** rather than vague requests like "make it better"
8. **Test conversation flows** end-to-end with various inputs
9. **Handle API errors** gracefully with retry logic
10. **Consider using a conversation manager** class for complex dialogues

## Related Techniques

- Prefill for output control
- System prompts for persistent behavior
- XML tags for structured multi-turn data extraction
- Thinking step by step across conversation turns
- Few-shot examples in system prompts for multi-turn patterns

## When to Use Multi-turn

- Iterative refinement of outputs
- Complex tasks requiring multiple steps
- Interactive data processing pipelines
- Conversational applications (chatbots, assistants)
- Debugging and clarification workflows
- Creative collaboration and brainstorming
- Incremental information gathering

## When to Avoid Multi-turn

- Simple one-shot queries
- Independent batch processing
- When context between queries is unrelated
- Token budget constraints for very long conversations
- Real-time applications where latency matters
