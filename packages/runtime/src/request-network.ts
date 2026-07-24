export type NetworkSource = "direct" | "trusted-proxy";

export class NetworkAddress {
  readonly #value: string;

  private constructor(value: string) {
    this.#value = value;
  }

  public static parse(value: unknown): NetworkAddress {
    if (typeof value !== "string" || (!isIpv4(value) && !isIpv6(value))) {
      throw new TypeError("Network address must be a valid IPv4 or IPv6 address.");
    }
    return new NetworkAddress(value.toLowerCase());
  }

  public valueForSecurityUse(): string {
    return this.#value;
  }

  public toJSON(): string {
    return "[REDACTED NETWORK ADDRESS]";
  }
}

export class NetworkFingerprint {
  readonly #value: string;

  private constructor(value: Uint8Array) {
    this.#value = [...value].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  public static fromDigestPrefix(value: unknown): NetworkFingerprint {
    if (!(value instanceof Uint8Array) || value.length !== 16) {
      throw new TypeError("Network fingerprint must contain exactly 16 digest bytes.");
    }
    return new NetworkFingerprint(value);
  }

  public value(): string {
    return this.#value;
  }
}

export class NetworkContext {
  public readonly address: NetworkAddress;
  public readonly source: NetworkSource;
  public readonly userAgentFingerprint: NetworkFingerprint | undefined;

  private constructor(input: {
    address: NetworkAddress;
    source: NetworkSource;
    userAgentFingerprint?: NetworkFingerprint;
  }) {
    this.address = input.address;
    this.source = input.source;
    this.userAgentFingerprint = input.userAgentFingerprint;
  }

  public static create(input: {
    address: NetworkAddress;
    source: NetworkSource;
    userAgentFingerprint?: NetworkFingerprint;
  }): NetworkContext {
    if (
      !(input.address instanceof NetworkAddress) ||
      (input.userAgentFingerprint !== undefined &&
        !(input.userAgentFingerprint instanceof NetworkFingerprint))
    ) {
      throw new TypeError("Network context requires validated minimized metadata.");
    }
    return new NetworkContext(input);
  }

  public toJSON(): string {
    return "[REDACTED NETWORK CONTEXT]";
  }
}

function isIpv4(value: string): boolean {
  const parts = value.split(".");
  return (
    parts.length === 4 &&
    parts.every((part) => /^(0|[1-9][0-9]{0,2})$/u.test(part) && Number(part) <= 255)
  );
}

function isIpv6(value: string): boolean {
  if (!value.includes(":") || !/^[0-9a-fA-F:]+$/u.test(value)) {
    return false;
  }
  const parsed = URL.parse(`http://[${value}]/`);
  return parsed?.hostname.startsWith("[") === true;
}
