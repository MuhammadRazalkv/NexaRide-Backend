import { Response } from 'express';

type SuccessResponse<T> = {
  success: true;
  message?: string;
} & T;

type ErrorResponse = {
  success: false;
  message: string;
};

export const sendSuccess = <T extends object>(
  res: Response,
  statusCode: number,
  payload: T,
  message?: string,
) => {
  const response: SuccessResponse<T> = {
    success: true,
    message,
    ...payload,
  };
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  errors?: string[],
) => {
  const response: ErrorResponse = { success: false, message };
  return res.status(statusCode).json(response);
};
