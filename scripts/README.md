# Scripts and Utilities

This directory contains Python scripts and utilities for the project.

## Claude Bedrock Integration

The `claude_bedrock` module provides a simple interface for invoking Claude models via AWS Bedrock.

### Installation

```bash
pip install -r requirements.txt
```

### Usage

#### Streaming Response

```python
from claude_bedrock import InferenceAdapter

adapter = InferenceAdapter()

# Stream response chunks
for chunk in adapter.invoke_model_with_response_stream("Tell me a short story"):
    print(chunk, end='', flush=True)
```

#### Complete Response

```python
from claude_bedrock import InferenceAdapter

adapter = InferenceAdapter()

# Get complete response
response = adapter.invoke_model("What is 2+2?")
print(response)
```

#### Custom Configuration

```python
from claude_bedrock import InferenceAdapter

# Use different region or model
adapter = InferenceAdapter(
    region_name='us-west-2',
    model_id='anthropic.claude-sonnet-4-5-20250929-v1:0'
)

response = adapter.invoke_model(
    prompt="Explain quantum computing",
    max_tokens=2000,
    temperature=0.7
)
```

### Available Models

- `anthropic.claude-haiku-4-5-20251001-v1:0` (default) - Fast and cost-effective
- `anthropic.claude-sonnet-4-5-20250929-v1:0` - Balanced performance
- `anthropic.claude-opus-4-20250514-v1:0` - Most capable

### AWS Credentials

Ensure your AWS credentials are configured via:
- Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
- AWS credentials file (`~/.aws/credentials`)
- IAM role (when running on AWS services)

### Required Permissions

Your AWS IAM user/role needs the following permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:*::foundation-model/anthropic.claude-*"
    }
  ]
}
```

## Lambda Functions

The `lambda/` directory contains AWS Lambda function handlers:

- **`contextual_retrieval_handler.py`** - Processes document chunks and adds contextual information for improved retrieval accuracy using Claude

See `lambda/README.md` for deployment instructions and usage details.

## S3 Integration

The `claude_bedrock` module also includes S3 utilities:

```python
from claude_bedrock import S3Adapter

s3 = S3Adapter()

# Read JSON from S3
data = s3.read_from_s3('my-bucket', 'path/to/file.json')

# Write JSON to S3
s3.write_output_to_s3('my-bucket', 'output/file.json', {'key': 'value'})

# Work with raw bytes
bytes_data = s3.read_bytes_from_s3('my-bucket', 'image.png')
s3.write_bytes_to_s3('my-bucket', 'output/image.png', bytes_data, 'image/png')
```

## Other Scripts

Additional utility scripts can be added to this directory as needed.
