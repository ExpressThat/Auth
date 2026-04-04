import Link from "next/link";

export default async function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-4xl font-bold">Welcome to ExpressThat Auth!</h1>
      <Link href="/admin" className="">
        Go to Admin
      </Link>
    </main>
  );
}
