class ApiError extends Error {
    constructor(statusCode, message = "Something wnt wrong", errors = [], statck = "") {
        super(message)
        this.message = message,
            this.statusCode = statusCode,
            this.data = null,
            this.success = false,
            this.errors = errors

        if (stack) {
            this.stack = stack
        } else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}