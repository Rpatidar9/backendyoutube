class ApiError extends Error {
    constructor(statusCode, message = "Something wnt wrong", errors = [], stack = "") {
        super(message)
        this.message = message,
            this.statusCode = statusCode,
            this.data = null,
            this.success = false,
            this.errors = errors

        if (stack && typeof stack === "string") {
            this.stack = stack
        } else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}
export { ApiError }