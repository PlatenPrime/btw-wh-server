export const CLIENT_INGEST_REQUIRED_CODE = "CLIENT_INGEST_REQUIRED";

export class ServerSkugrFillDisabledError extends Error {
  readonly code = CLIENT_INGEST_REQUIRED_CODE;

  constructor(konkName: string) {
    super(
      `Server skugr fill is disabled for ${konkName}; use client ingest`
    );
    this.name = "ServerSkugrFillDisabledError";
  }
}
