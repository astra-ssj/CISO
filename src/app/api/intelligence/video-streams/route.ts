import { NextResponse } from 'next/server';

const STREAMS = [
    { id: 'stream-1', name: 'Sky News Live', url: 'https://www.youtube.com/watch?v=9Auq9mYxFEE', category: 'News', region: 'Global', active: true },
    { id: 'stream-2', name: 'Al Jazeera English', url: 'https://www.youtube.com/watch?v=F-POY4Q0QSI', category: 'News', region: 'Global', active: true },
    { id: 'stream-3', name: 'France 24 English', url: 'https://www.youtube.com/watch?v=h3MuIUNCCzI', category: 'News', region: 'Europe', active: true },
    { id: 'stream-4', name: 'DW News', url: 'https://www.youtube.com/watch?v=GE_SfNVNyqk', category: 'News', region: 'Europe', active: true },
    { id: 'stream-5', name: 'NHK World', url: 'https://www.youtube.com/watch?v=f0ldnpLEZsI', category: 'News', region: 'Asia-Pacific', active: true },
    { id: 'stream-6', name: 'ISS Live Feed', url: 'https://www.youtube.com/watch?v=P9C25Un7xaM', category: 'Space', region: 'Global', active: true },
    { id: 'stream-7', name: 'Flightradar24 Live', url: 'https://www.flightradar24.com', category: 'Aviation', region: 'Global', active: true },
    { id: 'stream-8', name: 'MarineTraffic Live', url: 'https://www.marinetraffic.com', category: 'Maritime', region: 'Global', active: true },
    { id: 'stream-9', name: 'CSPAN', url: 'https://www.youtube.com/watch?v=HuyTENQjLJE', category: 'Politics', region: 'North America', active: true },
    { id: 'stream-10', name: 'Reuters Live', url: 'https://www.reuters.com/video/', category: 'News', region: 'Global', active: true },
];

export async function GET() {
    return NextResponse.json({
        streams: STREAMS,
        count: STREAMS.length,
        fetchedAt: new Date().toISOString(),
    });
}
