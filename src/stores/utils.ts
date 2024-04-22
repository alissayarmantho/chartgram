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

export function isValidVariableAssignment(part: string) {
  // This regex matches simple variable names and indexed access for lists and dictionaries
  const regex =
    /^[a-zA-Z_][a-zA-Z0-9_]*(\[\d+\]|\[[a-zA-Z_][a-zA-Z0-9_]*\]|\["[^"]*"\]|\['[^']*'\])*$/;

  return regex.test(part);
}

export function isValidArgument(arg: string) {
  // Regex to match variable/function names, strings (single or double quoted), and numbers (integer or decimal)
  // Not allowing ["a", "!"] or {2: 3} or any other objects. If they want to pass list / dict need to declare first
  // and pass in as variable
  const regex = /^([a-zA-Z_][a-zA-Z0-9_]*|"[^"]*"|'[^']*'|\d+(\.\d+)?)$/;

  return regex.test(arg);
}

export function isValidMiscStatement(part: string) {
  // Patterns to match the list and dictionary operations
  const listInsertPattern = /^[a-zA-Z0-9_]+\.append\([^)]+\)$/;
  const listInsertAtPattern = /^[a-zA-Z0-9_]+\.insert\(\d+,[^)]+\)$/;
  const listRemovePattern = /^[a-zA-Z0-9_]+\.remove\([^)]+\)$/;
  const listRemoveAtPattern = /^[a-zA-Z0-9_]+\.pop\(\d+\)$/;
  const accessPattern =
    /^[a-zA-Z_][a-zA-Z0-9_]*(\[\d+\]|\[[a-zA-Z_][a-zA-Z0-9_]*\]|\["[^"]*"\]|\['[^']*'\])+$/;
  const dictInsertPattern = /^[a-zA-Z0-9_]+\[[^\]]+\] = .+$/;
  const dictRemovePattern = /^del [a-zA-Z0-9_]+\[[^\]]+\]$/;
  const functionCallPattern = /^(\w+)\((.*?)\)$/;

  // Test the statement against all patterns
  return (
    listInsertPattern.test(part) ||
    listInsertAtPattern.test(part) ||
    listRemovePattern.test(part) ||
    listRemoveAtPattern.test(part) ||
    dictInsertPattern.test(part) ||
    dictRemovePattern.test(part) ||
    accessPattern.test(part) ||
    functionCallPattern.test(part)
  );
}
