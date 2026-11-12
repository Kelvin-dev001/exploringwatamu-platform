'use strict';

const { z } = require('zod');
const { LOCALES } = require('../constants/locales');

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().toLowerCase().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'A valid email is required'),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  // The website's language, for the confirmation email and its link.
  locale: z.enum(LOCALES).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'A valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'A valid email is required'),
  // The website's language, for the email and the link in it.
  locale: z.enum(LOCALES).optional(),
});

const resetPasswordSchema = z.object({
  token: z.string().trim().min(10, 'Invalid token'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

const verifyEmailSchema = z.object({
  token: z.string().trim().min(10, 'Invalid or expired confirmation link.').max(200),
});

const resendVerificationSchema = z.object({
  locale: z.enum(LOCALES).optional(),
});

module.exports = { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, verifyEmailSchema, resendVerificationSchema };
