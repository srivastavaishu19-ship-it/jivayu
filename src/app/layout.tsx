import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Jivayu - Health Intelligence',
  description: 'Your Personal Health Intelligence Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
