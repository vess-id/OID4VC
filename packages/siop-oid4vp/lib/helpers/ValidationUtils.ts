/**
 * Validation utilities for OID4VP 1.0
 *
 * This module provides validation functions for OID4VP 1.0 compliance,
 * particularly for DCQL queries and non-empty array requirements.
 */

/**
 * Validation error details
 */
export interface ValidationError {
  field: string
  message: string
  code: string
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean
  errors?: ValidationError[]
}

/**
 * Validates a DCQL query for OID4VP 1.0 compliance
 *
 * OID4VP 1.0 requirements:
 * - The `meta` parameter is REQUIRED for all credential queries
 * - The `credentials` array must be non-empty
 * - All arrays must be non-empty if present
 *
 * @param query - The DCQL query to validate
 * @returns Validation result with errors if invalid
 */
export function validateDcqlQueryV1_0(query: any): ValidationResult {
  const errors: ValidationError[] = []

  // Check if query exists
  if (!query || typeof query !== 'object') {
    errors.push({
      field: 'dcql_query',
      message: 'DCQL query must be an object',
      code: 'DCQL_INVALID_TYPE',
    })
    return { valid: false, errors }
  }

  // Check if credentials array exists and is non-empty
  if (!query.credentials) {
    errors.push({
      field: 'dcql_query.credentials',
      message: 'DCQL query must have a credentials array',
      code: 'DCQL_MISSING_CREDENTIALS',
    })
  } else if (!Array.isArray(query.credentials)) {
    errors.push({
      field: 'dcql_query.credentials',
      message: 'DCQL credentials must be an array',
      code: 'DCQL_CREDENTIALS_INVALID_TYPE',
    })
  } else if (query.credentials.length === 0) {
    errors.push({
      field: 'dcql_query.credentials',
      message: 'DCQL credentials array must be non-empty (OID4VP 1.0 requirement)',
      code: 'DCQL_CREDENTIALS_EMPTY',
    })
  } else {
    // Validate each credential
    query.credentials.forEach((cred: any, index: number) => {
      // Check for required meta parameter (OID4VP 1.0 requirement)
      if (!cred.meta || typeof cred.meta !== 'object') {
        errors.push({
          field: `dcql_query.credentials[${index}].meta`,
          message: 'DCQL credential meta parameter is REQUIRED in OID4VP 1.0',
          code: 'DCQL_MISSING_META',
        })
      }

      // Validate claims array is non-empty if present
      if (cred.claims !== undefined) {
        if (!Array.isArray(cred.claims)) {
          errors.push({
            field: `dcql_query.credentials[${index}].claims`,
            message: 'DCQL claims must be an array',
            code: 'DCQL_CLAIMS_INVALID_TYPE',
          })
        } else if (cred.claims.length === 0) {
          errors.push({
            field: `dcql_query.credentials[${index}].claims`,
            message: 'DCQL claims array must be non-empty if present (OID4VP 1.0 requirement)',
            code: 'DCQL_CLAIMS_EMPTY',
          })
        } else {
          // Validate each claim
          cred.claims.forEach((claim: any, claimIndex: number) => {
            if (!claim.path || !Array.isArray(claim.path) || claim.path.length === 0) {
              errors.push({
                field: `dcql_query.credentials[${index}].claims[${claimIndex}].path`,
                message: 'DCQL claim path must be a non-empty array',
                code: 'DCQL_CLAIM_PATH_INVALID',
              })
            }
          })
        }
      }

      // Validate claim_sets array is non-empty if present
      if (cred.claim_sets !== undefined) {
        if (!Array.isArray(cred.claim_sets)) {
          errors.push({
            field: `dcql_query.credentials[${index}].claim_sets`,
            message: 'DCQL claim_sets must be an array',
            code: 'DCQL_CLAIM_SETS_INVALID_TYPE',
          })
        } else if (cred.claim_sets.length === 0) {
          errors.push({
            field: `dcql_query.credentials[${index}].claim_sets`,
            message: 'DCQL claim_sets array must be non-empty if present (OID4VP 1.0 requirement)',
            code: 'DCQL_CLAIM_SETS_EMPTY',
          })
        }
      }
    })
  }

  // Validate credential_sets if present
  if (query.credential_sets !== undefined) {
    if (!Array.isArray(query.credential_sets)) {
      errors.push({
        field: 'dcql_query.credential_sets',
        message: 'DCQL credential_sets must be an array',
        code: 'DCQL_CREDENTIAL_SETS_INVALID_TYPE',
      })
    } else {
      query.credential_sets.forEach((set: any, index: number) => {
        if (!set.options || !Array.isArray(set.options) || set.options.length === 0) {
          errors.push({
            field: `dcql_query.credential_sets[${index}].options`,
            message: 'DCQL credential_set options must be a non-empty array',
            code: 'DCQL_CREDENTIAL_SET_OPTIONS_INVALID',
          })
        } else {
          // Each option must be a non-empty array
          set.options.forEach((option: any, optionIndex: number) => {
            if (!Array.isArray(option) || option.length === 0) {
              errors.push({
                field: `dcql_query.credential_sets[${index}].options[${optionIndex}]`,
                message: 'DCQL credential_set option must be a non-empty array',
                code: 'DCQL_CREDENTIAL_SET_OPTION_INVALID',
              })
            }
          })
        }
      })
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  }
}

/**
 * Validates that an array is non-empty
 *
 * OID4VP 1.0 requires that arrays, if present, must be non-empty
 *
 * @param arr - The array to validate
 * @param fieldName - The field name for error messages
 * @returns Validation result
 */
export function validateNonEmptyArray<T>(arr: T[] | undefined, fieldName: string): ValidationResult {
  if (arr === undefined) {
    // Undefined is allowed (optional field)
    return { valid: true }
  }

  const errors: ValidationError[] = []

  if (!Array.isArray(arr)) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must be an array`,
      code: 'INVALID_ARRAY_TYPE',
    })
  } else if (arr.length === 0) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must be non-empty if present (OID4VP 1.0 requirement)`,
      code: 'ARRAY_EMPTY',
    })
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  }
}

/**
 * Validates verifier_info array for OID4VP 1.0 compliance
 *
 * Requirements:
 * - Must be non-empty if present
 * - Each item must have format and data fields
 * - credential_ids must be non-empty if present
 *
 * @param verifierInfo - The verifier_info array to validate
 * @returns Validation result
 */
export function validateVerifierInfo(verifierInfo: any[] | undefined): ValidationResult {
  if (verifierInfo === undefined) {
    // Optional field
    return { valid: true }
  }

  const errors: ValidationError[] = []

  // Validate non-empty
  const arrayValidation = validateNonEmptyArray(verifierInfo, 'verifier_info')
  if (!arrayValidation.valid) {
    return arrayValidation
  }

  // Validate each item
  verifierInfo.forEach((item, index) => {
    if (!item.format || typeof item.format !== 'string') {
      errors.push({
        field: `verifier_info[${index}].format`,
        message: 'Verifier info format is required and must be a string',
        code: 'VERIFIER_INFO_MISSING_FORMAT',
      })
    }

    if (!item.data || typeof item.data !== 'string') {
      errors.push({
        field: `verifier_info[${index}].data`,
        message: 'Verifier info data is required and must be a string',
        code: 'VERIFIER_INFO_MISSING_DATA',
      })
    }

    if (item.credential_ids !== undefined) {
      const credIdsValidation = validateNonEmptyArray(item.credential_ids, `verifier_info[${index}].credential_ids`)
      if (!credIdsValidation.valid && credIdsValidation.errors) {
        errors.push(...credIdsValidation.errors)
      }
    }
  })

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  }
}

/**
 * Validates transaction_data array for OID4VP 1.0 compliance
 *
 * Requirements:
 * - Must be non-empty if present
 * - Each item must have type and credential_ids fields
 * - credential_ids must be non-empty
 * - transaction_data_hashes_alg defaults to ["sha-256"] if not provided
 *
 * @param transactionData - The transaction_data array to validate
 * @returns Validation result
 */
export function validateTransactionData(transactionData: any[] | undefined): ValidationResult {
  if (transactionData === undefined) {
    // Optional field
    return { valid: true }
  }

  const errors: ValidationError[] = []

  // Validate non-empty
  const arrayValidation = validateNonEmptyArray(transactionData, 'transaction_data')
  if (!arrayValidation.valid) {
    return arrayValidation
  }

  // Validate each item
  transactionData.forEach((item, index) => {
    if (!item.type || typeof item.type !== 'string') {
      errors.push({
        field: `transaction_data[${index}].type`,
        message: 'Transaction data type is required and must be a string',
        code: 'TRANSACTION_DATA_MISSING_TYPE',
      })
    }

    if (!item.credential_ids || !Array.isArray(item.credential_ids) || item.credential_ids.length === 0) {
      errors.push({
        field: `transaction_data[${index}].credential_ids`,
        message: 'Transaction data credential_ids is required and must be a non-empty array',
        code: 'TRANSACTION_DATA_MISSING_CREDENTIAL_IDS',
      })
    }

    // transaction_data_hashes_alg is optional, defaults to ["sha-256"]
    if (item.transaction_data_hashes_alg !== undefined) {
      const hashAlgValidation = validateNonEmptyArray(
        item.transaction_data_hashes_alg,
        `transaction_data[${index}].transaction_data_hashes_alg`
      )
      if (!hashAlgValidation.valid && hashAlgValidation.errors) {
        errors.push(...hashAlgValidation.errors)
      }
    }
  })

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  }
}

/**
 * Validates expected_origins array for OID4VP 1.0 compliance
 *
 * Requirements:
 * - Must be non-empty if present
 * - Each origin must be a valid string
 *
 * @param expectedOrigins - The expected_origins array to validate
 * @returns Validation result
 */
export function validateExpectedOrigins(expectedOrigins: string[] | undefined): ValidationResult {
  if (expectedOrigins === undefined) {
    // Optional field
    return { valid: true }
  }

  const errors: ValidationError[] = []

  // Validate non-empty
  const arrayValidation = validateNonEmptyArray(expectedOrigins, 'expected_origins')
  if (!arrayValidation.valid) {
    return arrayValidation
  }

  // Validate each origin
  expectedOrigins.forEach((origin, index) => {
    if (typeof origin !== 'string' || origin.trim().length === 0) {
      errors.push({
        field: `expected_origins[${index}]`,
        message: 'Expected origin must be a non-empty string',
        code: 'EXPECTED_ORIGIN_INVALID',
      })
    }
  })

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  }
}

/**
 * Throws an error if validation fails
 *
 * @param result - Validation result
 * @param errorMessage - Custom error message prefix
 */
export function throwIfInvalid(result: ValidationResult, errorMessage: string): void {
  if (!result.valid && result.errors) {
    const errorDetails = result.errors.map((e) => `${e.field}: ${e.message}`).join('; ')
    throw new Error(`${errorMessage}: ${errorDetails}`, {
      cause: {
        errors: result.errors,
      },
    })
  }
}
