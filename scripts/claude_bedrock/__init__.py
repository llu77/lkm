"""
Claude Bedrock Integration
===========================

Utilities for invoking Claude models via AWS Bedrock and working with S3.
"""

from .inference_adapter import InferenceAdapter
from .s3_adapter import S3Adapter

__all__ = ['InferenceAdapter', 'S3Adapter']
__version__ = '1.0.0'
