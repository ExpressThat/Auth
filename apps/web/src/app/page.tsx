"use client";

import { Button } from "@expressthat-auth/internal-components/button";
import EXLoginBox from "@expressthat-auth/ui/react/eXLoginBox";
import { DEFAULT_THEME } from "@expressthat-auth/ui/react/theme";
import ThemeContext from "@expressthat-auth/ui/react/theme.context";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold text-gray-900">ExpressThat Auth</h1>
      <p className="text-lg text-gray-600">Welcome to the authentication portal.</p>
      <Button>Get Started</Button>

      <ThemeContext.Provider value={DEFAULT_THEME}>
        <EXLoginBox onSubmit={(email, password) => alert(`${email}:${password}`)} />
      </ThemeContext.Provider>
    </main>
  );
}
