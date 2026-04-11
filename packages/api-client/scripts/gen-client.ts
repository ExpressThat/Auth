import { rmSync } from "node:fs";
import path from "node:path";
import { generateApi } from "swagger-typescript-api";

const inputPath = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : path.resolve(process.cwd(), "../api/bin/Release/net10.0/swagger.json");

rmSync(path.resolve(process.cwd(), "src/generated"), { recursive: true, force: true });

await generateApi({
  output: path.resolve(process.cwd(), "src/generated"),
  input: inputPath,
  httpClientType: "fetch",
  generateClient: true,
  generateRouteTypes: true,
  generateResponses: true,
  extractRequestBody: true,
  extractRequestParams: true,
  unwrapResponseData: true,
  moduleNameIndex: 1,
});
