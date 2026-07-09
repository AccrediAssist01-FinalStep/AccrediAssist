export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export type UserRole = 'Admin' | 'HOD' | 'Faculty' | 'AccreditationCommittee';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  designation?: string;
}
