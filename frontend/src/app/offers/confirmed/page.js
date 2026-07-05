"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Loader from '@/ui/loader';

/** Legacy route — confirmed offers are active and live on /offers; archive is separate. */
export default function ConfirmedOffersRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/archive?tab=completed&entity=offers');
    }, [router]);

    return (
        <div className="flex justify-center items-center min-h-screen">
            <Loader loading />
        </div>
    );
}
