export const successResponse = (res, data, message = 'Success', statusCode = 200, meta = null) => {
  const response = {
    success: true,
    message,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

export const errorResponse = (res, message = 'Error', statusCode = 500, error = null) => {
  const response = {
    success: false,
    message,
  };

  if (error) {
    // Only return detailed error in development
    response.error = process.env.NODE_ENV === 'development' ? error : undefined;
  }

  return res.status(statusCode).json(response);
};
