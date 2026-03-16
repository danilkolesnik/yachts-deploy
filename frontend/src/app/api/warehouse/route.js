import axios from 'axios';
import { NextResponse } from 'next/server';
import { URL } from '@/utils/constants';

// Always fetch fresh warehouse data (no long-lived cache),
// so newly created parts appear immediately in the UI.
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const {data} = await axios.get(`${URL}/warehouse`);
        return NextResponse.json(data.data);
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}