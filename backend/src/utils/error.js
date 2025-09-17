class HttpError extends Error {
  constructor(statusCode, message) {
    super(message); // Call the parent constructor with the message
    this.statusCode = statusCode; // Assign the status code
    Error.captureStackTrace(this, this.constructor); // Capture stack trace for debugging
  }
}

export const errorHandler = (statusCode, message) => {
  return new HttpError(statusCode, message);
};
