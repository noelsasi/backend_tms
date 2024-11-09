'use client'

import User from '@/app/components/User'
import { useSession, signOut } from 'next-auth/react'

const dashboard = () => {
    const { data:session } = useSession()
   
  
    console.log(session)
  return (
    <div>
      <User/>
        <h1>Dashboard</h1>
        <p>Hi {session?.user?.email}</p>
      
        <button onClick={() => signOut()}>Sign Out</button>
    </div>
  )
}

export default dashboard