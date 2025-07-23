import os
import glob
import google.generativeai as genai
from dotenv import load_dotenv

# Load API key from .env
load_dotenv()
API_KEY = os.getenv('GEMINI_API_KEY')

if not API_KEY:
    raise ValueError('GEMINI_API_KEY not found in .env file')

# Configure Gemini API globally
genai.configure(api_key=API_KEY)

# Initialize Gemini model
model = genai.GenerativeModel('models/gemini-2.0-flash')

# Define CODE_DIR as the directory where this script is located
CODE_DIR = os.path.dirname(os.path.abspath(__file__))
GENERATED_TESTS_DIR = os.path.join(CODE_DIR, 'generated_tests')
os.makedirs(GENERATED_TESTS_DIR, exist_ok=True)

# Find all Python files in backend (excluding venv, tests, generated_tests)
python_files = [
    f for f in glob.glob(os.path.join(CODE_DIR, '**', '*.py'), recursive=True)
    if 'venv' not in f and 'tests' not in f and 'generated_tests' not in f and '__init__' not in f
]

print("Python files found for test generation:")
for f in python_files:
    print(f)

PROMPT_TEMPLATE = (
    "You are an expert Python developer. Given the following FastAPI backend code (the main file is named 'app.py'), "
    "generate comprehensive pytest test cases that cover all main functionalities, edge cases, and error handling. "
    "Output only the test code, suitable for saving as a .py file. "
    "When importing the FastAPI app or functions, use 'from app import ...' instead of 'from main import ...'.\n"
    "Code:\n{code}\n"
)

def generate_tests_for_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        code = f.read()
    prompt = PROMPT_TEMPLATE.format(code=code)
    print(f"\nCalling Gemini API for: {filepath}")
    try:
        response = model.generate_content(prompt)
        if not response or not hasattr(response, 'text') or not response.text.strip():
            print(f"No response or empty response from Gemini for {filepath}")
            return None
        print(f"Response for {filepath}:\n{response.text[:500]}")  # Print first 500 chars
        return response.text
    except Exception as e:
        print(f"Error generating tests for {filepath}: {e}")
        return None

def main():
    for file_path in python_files:
        print(f'Generating tests for: {file_path}')
        test_code = generate_tests_for_file(file_path)
        if test_code:
            # Save test file
            base_name = os.path.basename(file_path)
            test_file_name = f'test_{base_name}'
            test_file_path = os.path.join(GENERATED_TESTS_DIR, test_file_name)
            with open(test_file_path, 'w', encoding='utf-8') as f:
                f.write(test_code)
            print(f'Generated: {test_file_path}')
        else:
            print(f'Skipped writing test for {file_path} (no test code generated)')
    print('All test files generated in:', GENERATED_TESTS_DIR)

if __name__ == '__main__':
    main()