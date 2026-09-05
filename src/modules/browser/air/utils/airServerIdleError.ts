export const AIR_SERVER_IDLE_CODE = "AIR_SERVER_IDLE";

export class AirServerIdleError extends Error {
  readonly code = AIR_SERVER_IDLE_CODE;

  constructor(message = "Air server network is idle; use client ingest") {
    super(message);
    this.name = "AirServerIdleError";
  }
}
