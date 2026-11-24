import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  workspaceId?: string;
  requestId?: string;
}
