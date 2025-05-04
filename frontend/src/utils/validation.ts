// filepath: c:\Users\gusta\vscodeProjetos\plann-er\frontend\src\utils\validation.ts
/**
 * Resultado de uma validação
 */
export interface ValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Valida um nome de usuário
 * @param name Nome a ser validado
 * @returns Resultado da validação
 */
export function validateName(name: string): ValidationResult {
  if (!name || name.trim() === "") {
    return {
      valid: false,
      message: "O nome é obrigatório",
    };
  }

  if (name.trim().length < 3) {
    return {
      valid: false,
      message: "O nome deve ter pelo menos 3 caracteres",
    };
  }

  return { valid: true };
}

/**
 * Valida um endereço de e-mail
 * @param email E-mail a ser validado
 * @returns Resultado da validação
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim() === "") {
    return {
      valid: false,
      message: "O e-mail é obrigatório",
    };
  }

  // Regex simples para validação básica de e-mail
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      valid: false,
      message: "Formato de e-mail inválido",
    };
  }

  return { valid: true };
}

/**
 * Valida uma senha
 * @param password Senha a ser validada
 * @returns Resultado da validação
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return {
      valid: false,
      message: "A senha é obrigatória",
    };
  }

  if (password.length < 6) {
    return {
      valid: false,
      message: "A senha deve ter pelo menos 6 caracteres",
    };
  }

  return { valid: true };
}

/**
 * Valida se duas senhas coincidem
 * @param password Senha
 * @param confirmPassword Confirmação da senha
 * @returns Resultado da validação
 */
export function validatePasswordMatch(
  password: string,
  confirmPassword: string
): ValidationResult {
  if (password !== confirmPassword) {
    return {
      valid: false,
      message: "As senhas não coincidem",
    };
  }

  return { valid: true };
}

/**
 * Valida uma data
 * @param date Data a ser validada (string ou objeto Date)
 * @returns Resultado da validação
 */
export function validateDate(date: string | Date): ValidationResult {
  if (!date) {
    return {
      valid: false,
      message: "A data é obrigatória",
    };
  }

  let dateObj: Date;

  if (typeof date === "string") {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }

  if (isNaN(dateObj.getTime())) {
    return {
      valid: false,
      message: "Data inválida",
    };
  }

  return { valid: true };
}

/**
 * Valida um intervalo de datas
 * @param startDate Data de início
 * @param endDate Data de término
 * @returns Resultado da validação
 */
export function validateDateRange(
  startDate: string | Date,
  endDate: string | Date
): ValidationResult {
  const startDateValidation = validateDate(startDate);
  if (!startDateValidation.valid) {
    return startDateValidation;
  }

  const endDateValidation = validateDate(endDate);
  if (!endDateValidation.valid) {
    return endDateValidation;
  }

  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;

  if (start > end) {
    return {
      valid: false,
      message: "A data de início deve ser anterior à data de término",
    };
  }

  return { valid: true };
}

/**
 * Valida se um campo obrigatório foi preenchido
 * @param value Valor a ser validado
 * @param fieldName Nome do campo para a mensagem de erro
 * @returns Resultado da validação
 */
export function validateRequired(
  value: any,
  fieldName: string
): ValidationResult {
  if (value === undefined || value === null || value === "") {
    return {
      valid: false,
      message: `${fieldName} é obrigatório`,
    };
  }

  if (typeof value === "string" && value.trim() === "") {
    return {
      valid: false,
      message: `${fieldName} é obrigatório`,
    };
  }

  return { valid: true };
}

/**
 * Valida um formulário inteiro verificando múltiplos resultados de validação
 * @param validationResults Lista de resultados de validação
 * @returns Resultado da validação com a primeira mensagem de erro encontrada
 */
export function validateForm(
  validationResults: ValidationResult[]
): ValidationResult {
  for (const result of validationResults) {
    if (!result.valid) {
      return result;
    }
  }

  return { valid: true };
}
