# GenAI-Powered Backend Test Generation

This guide explains how to use Google Gemini Generative AI to automatically generate pytest test cases for your backend code.

## Prerequisites
- Python 3.8+
- `pip install google-generativeai python-dotenv`
- A valid Gemini API key (see `.env.example`)

## Setup
1. Copy `.env.example` to `.env` and add your Gemini API key:
   ```bash
   cp .env.example .env
   # Edit .env and paste your API key
   ```
2. Install dependencies:
   ```bash
   pip install google-generativeai python-dotenv
   ```

## Usage
1. Run the test generation script:
   ```bash
   python generate_backend_tests.py
   ```
2. Generated test files will appear in `backend/generated_tests/`.
3. Run the generated tests with:
   ```bash
   pytest generated_tests/
   ```

## Cleanup / Reverting
- To remove all generated tests, simply delete the `generated_tests/` folder:
  ```bash
  rm -rf generated_tests/
  ```

## Notes
- The script will not modify your existing code or tests.
- You can safely delete the generated files at any time.
- If you want to regenerate tests, just rerun the script. 