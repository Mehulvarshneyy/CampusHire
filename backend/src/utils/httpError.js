export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function notFound(message = 'Resource not found') {
  return new HttpError(404, message);
}

export function forbidden(message = 'You are not allowed to perform this action') {
  return new HttpError(403, message);
}

export function unauthorized(message = 'Authentication required') {
  return new HttpError(401, message);
}

export function badRequest(message, details) {
  return new HttpError(400, message, details);
}

export function conflict(message) {
  return new HttpError(409, message);
}
