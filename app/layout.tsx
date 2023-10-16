import { Figtree } from 'next/font/google'

import getSongsByUserId from '@/actions/getSongsByUserId'
import getActiveProductsWithPrices from '@/actions/getActiveProductsWithPrices'
import Sidebar from '@/components/Sidebar'
import ToasterProvider from '@/public/providers/ToasterProvider'
import UserProvider from '@/public/providers/UserProvider'
import ModalProvider from '@/public/providers/ModalProvider'
import SupabaseProvider from '@/public/providers/SupabaseProvider'
import Player from '@/components/Player'

import './globals.css'

const font = Figtree({ subsets: ['latin'] })

export const metadata = {
  title: "Beat'em up",
  description: 'simplesmente um Spotify Clone',
}

export const revalidate = 0;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const products = await getActiveProductsWithPrices();
  const userSongs = await getSongsByUserId();

  return (
    <html lang="en">
      <body className={font.className}>
        <ToasterProvider />
        <SupabaseProvider>
          <UserProvider>
            <ModalProvider products={products} />
            <Sidebar songs={userSongs}>
              {children}
            </Sidebar>
            <Player />
          </UserProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
}
