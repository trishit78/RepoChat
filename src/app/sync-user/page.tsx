import { db } from '@/server/db';
import { auth, clerkClient } from '@clerk/nextjs/server'
import { notFound, redirect } from 'next/navigation';

const SyncUser = async () => {
  const { userId } = await auth();
  
  if (!userId) {
    console.error('No userId found in auth');
    throw new Error('User not found');
  }

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    console.log('User from Clerk:', {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName
    });

    if (!user.emailAddresses[0]?.emailAddress) {
      console.error('No email address found for user');
      return notFound();
    }

  
    const result = await db.user.upsert({
      where: {
        emailAddress: user.emailAddresses[0].emailAddress
      },
      update: {
        imageUrl: user.imageUrl,
        firstName: user.firstName,
        lastName: user.lastName
      },
      create: {
        id: userId,
        emailAddress: user.emailAddresses[0].emailAddress,
        imageUrl: user.imageUrl,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });

    console.log('Database operation successful:', result);
    
  } catch (error) {
    console.error('Error syncing user data:', error);
    throw new Error(`Failed to sync user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

 
  redirect('/dashboard');

}

export default SyncUser;