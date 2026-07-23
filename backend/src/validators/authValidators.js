'use strict';

const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().toLowerCase().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'A valid email is required'),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'A valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'A valid email is required'),
});

const resetPasswordSchema = z.object({
  token: z.string().trim().min(10, 'Invalid token'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

module.exports = { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema };
