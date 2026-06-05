"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Loader from '@/ui/loader';

const OffersHistoryRedirect = () => {
    const router = useRouter();

    useEffect(() => {
        router.replace('/archive?tab=changes');
    }, [router]);

    return (
        <div className="flex justify-center items-center min-h-screen">
            <Loader loading />
        </div>
    );
};

export default OffersHistoryRedirect;
