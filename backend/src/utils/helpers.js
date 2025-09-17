export const formatZodError = (error) => {
  return error.errors.map((err) => ({
    field: err.path.join("."), 
    message: err.message, 
  }));
};
