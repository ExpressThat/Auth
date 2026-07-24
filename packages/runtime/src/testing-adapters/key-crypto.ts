import type { PublishedSigningJwk, SigningAlgorithm } from "../index.js";

export type SigningKeyPair = {
  privateKey: CryptoKey;
  publicKey: PublishedSigningJwk;
};

function webBytes(value: Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(value.length);
  copy.set(value);
  return copy;
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

async function thumbprint(canonicalJwk: string): Promise<string> {
  return base64Url(
    new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalJwk))),
  );
}

export function requireRsaPublicMembers(exported: JsonWebKey): Readonly<{ e: string; n: string }> {
  if (!exported.e || !exported.n) {
    throw new Error("Generated RSA key lacks public members.");
  }
  return { e: exported.e, n: exported.n };
}

export function requireEcPublicMembers(exported: JsonWebKey): Readonly<{ x: string; y: string }> {
  if (!exported.x || !exported.y) {
    throw new Error("Generated EC key lacks public members.");
  }
  return { x: exported.x, y: exported.y };
}

export async function generateSigningKey(algorithm: SigningAlgorithm): Promise<SigningKeyPair> {
  if (algorithm === "RS256") {
    const pair = await crypto.subtle.generateKey(
      {
        hash: "SHA-256",
        modulusLength: 2_048,
        name: "RSASSA-PKCS1-v1_5",
        publicExponent: new Uint8Array([1, 0, 1]),
      },
      false,
      ["sign", "verify"],
    );
    const exported = await crypto.subtle.exportKey("jwk", pair.publicKey);
    const { e, n } = requireRsaPublicMembers(exported);
    const kid = await thumbprint(JSON.stringify({ e, kty: "RSA", n }));
    return {
      privateKey: pair.privateKey,
      publicKey: {
        alg: "RS256",
        e,
        kid,
        kty: "RSA",
        n,
        use: "sig",
      },
    };
  }

  const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, false, [
    "sign",
    "verify",
  ]);
  const exported = await crypto.subtle.exportKey("jwk", pair.publicKey);
  const { x, y } = requireEcPublicMembers(exported);
  const kid = await thumbprint(JSON.stringify({ crv: "P-256", kty: "EC", x, y }));
  return {
    privateKey: pair.privateKey,
    publicKey: {
      alg: "ES256",
      crv: "P-256",
      kid,
      kty: "EC",
      use: "sig",
      x,
      y,
    },
  };
}

export async function signBytes(pair: SigningKeyPair, payload: Uint8Array): Promise<Uint8Array> {
  const parameters =
    pair.publicKey.alg === "RS256"
      ? { name: "RSASSA-PKCS1-v1_5" }
      : { hash: "SHA-256", name: "ECDSA" };
  return new Uint8Array(await crypto.subtle.sign(parameters, pair.privateKey, webBytes(payload)));
}

export async function verifyBytes(
  key: PublishedSigningJwk,
  payload: Uint8Array,
  signature: Uint8Array,
): Promise<boolean> {
  const rsa = key.alg === "RS256";
  const parameters = rsa
    ? { hash: "SHA-256", name: "RSASSA-PKCS1-v1_5" }
    : { name: "ECDSA", namedCurve: "P-256" };
  const publicKey = await crypto.subtle.importKey("jwk", key, parameters, false, ["verify"]);
  return crypto.subtle.verify(
    rsa ? { name: "RSASSA-PKCS1-v1_5" } : { hash: "SHA-256", name: "ECDSA" },
    publicKey,
    webBytes(signature),
    webBytes(payload),
  );
}

export function cryptoBytes(value: Uint8Array): Uint8Array<ArrayBuffer> {
  return webBytes(value);
}
