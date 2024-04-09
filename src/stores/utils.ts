export function isValidPythonFunctionDefinition(part: string) {
  // Regular expression to check for a structure similar to Python function definitions
  // Allows function names with alphanumeric characters and underscores, parameters with spaces, and ends with a colon
  const regex = /^[a-zA-Z_][a-zA-Z0-9_]*\(\s*[a-zA-Z0-9_,\s]*\s*\):$/;

  return regex.test(part);
}

export function isValidVariableFunctionName(part: string) {
  const regex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

  return regex.test(part);
}
