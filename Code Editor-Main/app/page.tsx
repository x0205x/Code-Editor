"use client"
import CodeEditor from "../components/CodeEditor"
import Head from "next/head"

export default function Home() {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Code Editor</title>
      </Head>
      <main className="min-h-screen">
        <CodeEditor />
      </main>
    </>
  )
}

