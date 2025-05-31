export interface ApiError {
  code: "VALIDATION_ERROR" | "NOT_FOUND" | "CONFLICT" | "SERVER_ERROR" | "CALCULATION_ERROR"
  message: string
  details?: string
}

export class ApiErrorHandler {
  static createResponse(error: ApiError, status: number): Response {
    return new Response(
      JSON.stringify({ error }),
      {
        status,
        headers: { "Content-Type": "application/json" },
      }
    )
  }

  static validationError(message: string, details?: string): Response {
    return this.createResponse(
      {
        code: "VALIDATION_ERROR",
        message,
        details,
      },
      400
    )
  }

  static notFoundError(message: string = "リソースが見つかりません"): Response {
    return this.createResponse(
      {
        code: "NOT_FOUND",
        message,
      },
      404
    )
  }

  static conflictError(message: string, details?: string): Response {
    return this.createResponse(
      {
        code: "CONFLICT",
        message,
        details,
      },
      409
    )
  }

  static calculationError(message: string, details?: string): Response {
    return this.createResponse(
      {
        code: "CALCULATION_ERROR",
        message,
        details,
      },
      422
    )
  }

  static serverError(message: string = "サーバーエラーが発生しました"): Response {
    return this.createResponse(
      {
        code: "SERVER_ERROR",
        message,
      },
      500
    )
  }

  static handleUnknownError(error: unknown): Response {
    console.error("Unknown error:", error)
    
    if (error instanceof Error) {
      // Don't expose detailed error messages to users in production
      const isProduction = process.env.NODE_ENV === "production"
      return this.createResponse(
        {
          code: "SERVER_ERROR",
          message: "予期しないエラーが発生しました",
          details: isProduction ? undefined : error.message,
        },
        500
      )
    }

    return this.serverError()
  }
}

export class ValidationUtils {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  static validateDate(dateString: string): Date | null {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return null
    }
    return date
  }

  static validateDateRange(startDate: string, endDate: string): {
    start: Date
    end: Date
  } | null {
    const start = this.validateDate(startDate)
    const end = this.validateDate(endDate)

    if (!start || !end) {
      return null
    }

    if (start >= end) {
      return null
    }

    return { start, end }
  }

  static validatePositiveNumber(value: string | number): number | null {
    const num = typeof value === "string" ? parseFloat(value) : value
    if (isNaN(num) || num <= 0) {
      return null
    }
    return num
  }

  static validatePositiveInteger(value: string | number): number | null {
    const num = typeof value === "string" ? parseInt(value, 10) : value
    if (isNaN(num) || num <= 0 || !Number.isInteger(num)) {
      return null
    }
    return num
  }

  static validateRequiredFields(
    data: Record<string, any>,
    requiredFields: string[]
  ): string[] {
    const missingFields: string[] = []
    
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null || data[field] === "") {
        missingFields.push(field)
      }
    }

    return missingFields
  }
}