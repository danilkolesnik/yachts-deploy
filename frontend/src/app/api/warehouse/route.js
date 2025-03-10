import axios from 'axios';
import { NextResponse } from 'next/server';
import { URL } from '@/utils/constants';

export const dynamic = 'force-static';

export async function GET() {
    try {
        const {data} = await axios.get(`${URL}/warehouse`);
        return NextResponse.json(data.data);
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}