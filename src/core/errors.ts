export interface MoneyFiErrorBody {
  code?: number;
  message?: string;
  errorCode?: string;
  [key: string]: unknown;
}

export class MoneyFiSdkError extends Error {
  readonly status: number;
  readonly code: number | undefined;
  readonly errorCode: string | undefined;
  readonly details: Readonly<MoneyFiErrorBody>;

  constructor(status: number, body: MoneyFiErrorBody) {
    super(body.message ?? `MoneyFi API request failed with status ${status}`);
    this.name = "MoneyFiSdkError";
    this.status = status;
    this.code = typeof body.code === "number" ? body.code : undefined;
    this.errorCode = typeof body.errorCode === "string" ? body.errorCode : undefined;
    this.details = Object.freeze({ ...body });
  }
}

export class MoneyFiNetworkError extends Error {
  constructor(message = "Unable to reach the MoneyFi API") {
    super(message);
    this.name = "MoneyFiNetworkError";
  }
}

export class MoneyFiValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MoneyFiValidationError";
  }
}
