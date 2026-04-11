import { Api } from "./generated/Api";
export type * from "./generated/Api";

export type ExpressThatAuthClient = InstanceType<typeof Api<string>>;

export function createExpressThatAuthClient(
  baseUrl: string,
  token?: string,
): ExpressThatAuthClient {
  const client = new Api<string>({
    baseUrl,
    securityWorker: (t) => (t ? { headers: { Authorization: `Bearer ${t}` } } : {}),
  });
  if (token) client.setSecurityData(token);
  return client;
}
