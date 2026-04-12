import * as fs from "node:fs";
import * as path from "node:path";
import type { PlopTypes } from "@turbo/gen";

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setGenerator("csharp-lib", {
    description: "Create a new C# .NET 10 class library workspace package",
    prompts: [
      {
        type: "input",
        name: "name",
        message: 'Package name (without the "@expressthat-auth/" prefix, e.g. "my-lib"):',
        validate: (input: string) => {
          if (!input.trim()) return "Package name is required";
          if (!/^[a-z][a-z0-9-]*$/.test(input.trim())) {
            return "Package name must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens";
          }
          return true;
        },
        filter: (input: string) => input.trim(),
      },
    ],
    actions: (answers) => {
      const { name, turbo } = answers as {
        name: string;
        turbo: { paths: { root: string } };
      };

      const root = turbo.paths.root;
      const pkgDir = path.join(root, "packages", name);
      const nodeModulesPath = path.join(root, "node_modules", "@expressthat-auth", name);

      if (fs.existsSync(pkgDir)) {
        throw new Error(`A package already exists at packages/${name}. Choose a different name.`);
      }
      if (fs.existsSync(nodeModulesPath)) {
        throw new Error(
          `"@expressthat-auth/${name}" already exists in node_modules. Choose a different name.`,
        );
      }

      return [
        {
          type: "add",
          path: "packages/{{name}}/package.json",
          templateFile: "templates/csharp-lib/package.json.hbs",
        },
        {
          type: "add",
          path: "packages/{{name}}/{{pascalCase name}}.csproj",
          templateFile: "templates/csharp-lib/Csproj.hbs",
        },
        {
          type: "add",
          path: "packages/{{name}}/README.md",
          templateFile: "templates/csharp-lib/README.md.hbs",
        },
        {
          type: "add",
          path: "packages/{{name}}/src/.gitkeep",
          templateFile: "templates/csharp-lib/src/.gitkeep",
        },
      ];
    },
  });
}
