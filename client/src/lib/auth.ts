import { apiRequest } from "./queryClient";

export interface User {
  id: number;
  username: string;
  role: 'customer' | 'admin' | 'sub_admin' | 'super_admin';
  email?: string;
  phone?: string;
  adminId?: string | null;
  isActive?: boolean;
  firstName?: string | null;
  lastName?: string | null;
  adminPermissions?: Record<string, boolean>;
  address_line_1?: string;
  address_line_2?: string;
  area?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  latitude?: string;
  longitude?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  area?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  latitude?: string;
  longitude?: string;
  role?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Login failed' }));
    throw new Error(error.message || 'Invalid credentials');
  }

  const data = await response.json();
  
  // Store token in localStorage
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  
  // Set flag to trigger popup banner after login
  sessionStorage.setItem('just_logged_in', 'true');
  
  return data;
}

export async function register(userData: RegisterData): Promise<AuthResponse> {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Registration failed' }));
    throw new Error(error.message || 'Registration failed');
  }

  const data = await response.json();
  
  // Store token in localStorage
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  
  return data;
}

export async function sendOTP(phone: string): Promise<void> {
  await apiRequest('POST', '/api/auth/send-otp', { phone });
}

export async function verifyOTP(phone: string, otp: string): Promise<AuthResponse> {
  const response = await apiRequest('POST', '/api/auth/verify-otp', { phone, otp });
  const data = await response.json();
  
  // Store token in localStorage
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  
  return data;
}

export function logout(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function getStoredToken(): string | null {
  return localStorage.getItem('token');
}

export function getStoredUser(): User | null {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

export function isAuthenticated(): boolean {
  return !!getStoredToken();
}

export function hasRole(role: string): boolean {
  const user = getStoredUser();
  return user?.role === role;
}
