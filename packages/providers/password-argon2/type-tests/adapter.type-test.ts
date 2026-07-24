import {
  NodeArgon2PasswordHasher,
  PortableArgon2PasswordHasher,
} from "@expressthat-auth/password-argon2";
import type { PasswordHasher } from "@expressthat-auth/runtime";
import { SequenceRandomSource } from "@expressthat-auth/runtime/testing";

const salt = new Uint8Array(16);
const nativeHasher: PasswordHasher = new NodeArgon2PasswordHasher(new SequenceRandomSource([salt]));
const portableHasher: PasswordHasher = new PortableArgon2PasswordHasher(
  new SequenceRandomSource([salt]),
);

void nativeHasher;
void portableHasher;
