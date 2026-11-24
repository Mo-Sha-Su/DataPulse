export interface User {
  id: string | number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  detail?: string;
  user?: User;
  token?: string;
}
