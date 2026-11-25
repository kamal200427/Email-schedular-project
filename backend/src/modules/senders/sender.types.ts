
export interface SenderRecord {
  id: number;
  user_id: number;
  name: string;
  email: string;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  hourly_limit: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSenderInput {
  name: string;
  email: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUsername: string;
  smtpPassword: string;
  hourlyLimit: number;
}

export interface UpdateSenderInput {
  name?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUsername?: string;
  smtpPassword?: string;
  hourlyLimit?: number;
  isActive?: boolean;
}
