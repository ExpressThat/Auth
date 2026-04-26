"use client";

import { Button } from "@expressthat-auth/internal-components/button";
import { ExButton } from "@expressthat-auth/ui-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold text-gray-900">ExpressThat Auth</h1>
      <p className="text-lg text-gray-600">Welcome to the authentication portal.</p>
      <Button>Get Started</Button>
      <ExButton
        label="Click Me"
        variant="outline"
        onExClick={() => {
          alert("test");
        }}
      />
    </main>
  );
}
