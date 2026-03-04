export function successResponse(data, status = 200) {
  return {
    success: true,
    ...data,
    _status: status
  };
}

export function errorResponse(message, status = 400) {
  return {
    success: false,
    message,
    _status: status
  };
}
