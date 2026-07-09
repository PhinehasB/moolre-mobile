const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export type AccountType = 'EMPLOYEE' | 'INDIVIDUAL';

export type Account = {
  id: string;
  accountType: AccountType;
  firstName: string;
  lastName: string;
  username?: string | null;
  email: string;
  phone?: string | null;
  role?: string | null;
  companyName?: string | null;
  linkedToCompany: boolean;
  status: string;
  mustChangePassword: boolean;
};

export type UpdateProfilePayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  username?: string;
};

export type Session = {
  tokenType: string;
  accessToken: string;
  expiresInSeconds: number;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  mustChangePassword: boolean;
  account: Account;
};

export type SignupPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
};

export type HomeBill = {
  id: string;
  name: string;
  category: string;
  amount: number;
  frequencyLabel: string;
  locked: boolean;
  autoSwept: boolean;
};

export type HomeNextSalary = {
  sourceName: string;
  amount: number;
  expectedDate: string;
  daysUntil: number;
  progress: number;
};

export type HomeData = {
  firstName: string;
  wallet: { currency: string; freeSpendable: number; lockedSafe: number };
  nextSalary: HomeNextSalary | null;
  bills: HomeBill[];
};

export type PendingSalary = {
  id: string;
  sourceName: string;
  amount: number;
  spendableAmount: number;
  safeAmount: number;
  currency: string;
  paidAt: string;
};

export type BillItem = {
  id: string;
  name: string;
  category: string;
  amount: number;
  destination: string | null;
  network: string | null;
  recipientNumber: string | null;
  active: boolean;
  locked: boolean;
};

export type BillsData = {
  monthlyIncome: number | null;
  lockedForBills: number;
  spendable: number | null;
  sweepPercentage: number | null;
  currency: string;
  obligations: BillItem[];
};

export type CreateBillPayload = {
  name: string;
  amount: number;
  category: string;
  network: string;
  recipientNumber?: string;
};

export type TransferPayload = {
  network: string;
  phone: string;
  amount: number;
};

export type TransferResult = {
  id: string;
  amount: number;
  klareFee: number;
  total: number;
  network: string;
  recipient: string;
  recipientName: string | null;
  status: string;
  currency: string;
  freeBalance: number;
  createdAt: string;
};

export type TransferInitiation = {
  reference: string;
  status: string;
  phoneLast4: string | null;
  amount: number;
  klareFee: number;
  total: number;
  currency: string;
};

export type UpdateBillPayload = {
  name?: string;
  amount?: number;
  active?: boolean;
  category?: string;
  network?: string;
  recipientNumber?: string;
};

export type BillPaymentResult = {
  paidCount: number;
  skippedCount: number;
  totalPaid: number;
  currency: string;
  freeBalance: number;
  lockedBalance: number;
};

export type FundWalletPayload = {
  amount: number;
  payer: string;
};

export type FundingResult = {
  externalRef: string;
  status: 'AWAITING_OTP' | 'AWAITING_APPROVAL' | 'SUCCESS' | 'FAILED';
  message: string | null;
  amount: number;
};

export type ActivityItem = {
  id: string;
  type: 'TRANSFER' | 'SALARY' | 'SWEEP' | 'FUND';
  title: string;
  subtitle: string | null;
  amount: number;
  status: string;
  createdAt: string;
};

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach Klare right now. Check your connection and try again.', 'NETWORK_ERROR', 0);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    if (response.status === 401 && options.token && unauthorizedHandler) {
      unauthorizedHandler();
    }
    const violation = payload?.error?.violations?.[0]?.message as string | undefined;
    const message = violation ?? payload?.error?.message ?? 'Something went wrong. Please try again.';
    const code = payload?.error?.code ?? 'UNKNOWN';
    throw new ApiError(message, code, response.status);
  }
  return payload.data as T;
}

export const authApi = {
  signup(payload: SignupPayload) {
    return request<Session>('/api/v1/personal/auth/signup', {
      method: 'POST',
      body: payload,
    });
  },
  login(username: string, password: string, rememberMe: boolean) {
    return request<Session>('/api/v1/personal/auth/login', {
      method: 'POST',
      body: { username, password, rememberMe },
    });
  },
  activate(newPassword: string, confirmPassword: string, token: string) {
    return request<Session>('/api/v1/personal/auth/activate', {
      method: 'POST',
      body: { newPassword, confirmPassword },
      token,
    });
  },
  me(token: string) {
    return request<Account>('/api/v1/personal/auth/me', { token });
  },
  updateProfile(payload: UpdateProfilePayload, token: string) {
    return request<Account>('/api/v1/personal/auth/me', { method: 'PATCH', body: payload, token });
  },
  logout(refreshToken: string) {
    return request<null>('/api/v1/personal/auth/logout', {
      method: 'POST',
      body: { refreshToken },
    });
  },
};

export const personalApi = {
  home(token: string) {
    return request<HomeData>('/api/v1/personal/home', { token });
  },
  bills(token: string) {
    return request<BillsData>('/api/v1/personal/bills', { token });
  },
  createBill(payload: CreateBillPayload, token: string) {
    return request<BillItem>('/api/v1/personal/bills', { method: 'POST', body: payload, token });
  },
  updateBill(id: string, payload: UpdateBillPayload, token: string) {
    return request<BillItem>(`/api/v1/personal/bills/${id}`, { method: 'PATCH', body: payload, token });
  },
  deleteBill(id: string, token: string) {
    return request<null>(`/api/v1/personal/bills/${id}`, { method: 'DELETE', token });
  },
  payBills(token: string) {
    return request<BillPaymentResult>('/api/v1/personal/bills/pay', { method: 'POST', token });
  },
  fundWallet(payload: FundWalletPayload, token: string) {
    return request<FundingResult>('/api/v1/personal/wallet/fund', { method: 'POST', body: payload, token });
  },
  submitFundingOtp(externalRef: string, otpcode: string, token: string) {
    return request<FundingResult>('/api/v1/personal/wallet/fund/otp', {
      method: 'POST',
      body: { externalRef, otpcode },
      token,
    });
  },
  fundingStatus(externalRef: string, token: string) {
    return request<FundingResult>(`/api/v1/personal/wallet/fund/${externalRef}/status`, { token });
  },
  initiateTransfer(payload: TransferPayload, token: string) {
    return request<TransferInitiation>('/api/v1/personal/transfers', { method: 'POST', body: payload, token });
  },
  confirmTransfer(reference: string, code: string, token: string) {
    return request<TransferResult>(`/api/v1/personal/transfers/${reference}/confirm`, {
      method: 'POST',
      body: { code },
      token,
    });
  },
  pendingSalary(token: string) {
    return request<PendingSalary | null>('/api/v1/personal/salary/pending', { token });
  },
  acknowledgeSalary(id: string, token: string) {
    return request<null>(`/api/v1/personal/salary/${id}/acknowledge`, { method: 'POST', token });
  },
  transactions(token: string) {
    return request<ActivityItem[]>('/api/v1/personal/transactions', { token });
  },
  registerDevice(expoPushToken: string, platform: string, token: string) {
    return request<null>('/api/v1/personal/devices', {
      method: 'POST',
      body: { expoPushToken, platform },
      token,
    });
  },
  removeDevice(expoPushToken: string, token: string) {
    return request<null>('/api/v1/personal/devices/remove', {
      method: 'POST',
      body: { expoPushToken },
      token,
    });
  },
};
