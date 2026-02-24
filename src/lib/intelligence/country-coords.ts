/**
 * ISO country code → capital city coordinates lookup.
 * Used for placing office pins on the World Monitor map
 * when the Company model only has a country code.
 */

export interface CountryCoord {
    lat: number;
    lng: number;
    name: string;
    region: string;
}

export const COUNTRY_COORDS: Record<string, CountryCoord> = {
    // Europe
    DE: { lat: 52.52, lng: 13.405, name: 'Germany', region: 'Europe' },
    GB: { lat: 51.5074, lng: -0.1278, name: 'United Kingdom', region: 'Europe' },
    FR: { lat: 48.8566, lng: 2.3522, name: 'France', region: 'Europe' },
    NL: { lat: 52.3676, lng: 4.9041, name: 'Netherlands', region: 'Europe' },
    BE: { lat: 50.8503, lng: 4.3517, name: 'Belgium', region: 'Europe' },
    AT: { lat: 48.2082, lng: 16.3738, name: 'Austria', region: 'Europe' },
    CH: { lat: 46.9481, lng: 7.4474, name: 'Switzerland', region: 'Europe' },
    IT: { lat: 41.9028, lng: 12.4964, name: 'Italy', region: 'Europe' },
    ES: { lat: 40.4168, lng: -3.7038, name: 'Spain', region: 'Europe' },
    PT: { lat: 38.7223, lng: -9.1393, name: 'Portugal', region: 'Europe' },
    IE: { lat: 53.3498, lng: -6.2603, name: 'Ireland', region: 'Europe' },
    SE: { lat: 59.3293, lng: 18.0686, name: 'Sweden', region: 'Europe' },
    NO: { lat: 59.9139, lng: 10.7522, name: 'Norway', region: 'Europe' },
    FI: { lat: 60.1699, lng: 24.9384, name: 'Finland', region: 'Europe' },
    DK: { lat: 55.6761, lng: 12.5683, name: 'Denmark', region: 'Europe' },
    PL: { lat: 52.2297, lng: 21.0122, name: 'Poland', region: 'Europe' },
    CZ: { lat: 50.0755, lng: 14.4378, name: 'Czech Republic', region: 'Europe' },
    RO: { lat: 44.4268, lng: 26.1025, name: 'Romania', region: 'Europe' },
    BG: { lat: 42.6977, lng: 23.3219, name: 'Bulgaria', region: 'Europe' },
    GR: { lat: 37.9838, lng: 23.7275, name: 'Greece', region: 'Europe' },
    HR: { lat: 45.815, lng: 15.9819, name: 'Croatia', region: 'Europe' },
    HU: { lat: 47.4979, lng: 19.0402, name: 'Hungary', region: 'Europe' },
    SK: { lat: 48.1486, lng: 17.1077, name: 'Slovakia', region: 'Europe' },
    LT: { lat: 54.6872, lng: 25.2797, name: 'Lithuania', region: 'Europe' },
    LV: { lat: 56.9496, lng: 24.1052, name: 'Latvia', region: 'Europe' },
    EE: { lat: 59.437, lng: 24.7536, name: 'Estonia', region: 'Europe' },
    LU: { lat: 49.6117, lng: 6.1319, name: 'Luxembourg', region: 'Europe' },

    // Americas
    US: { lat: 38.9072, lng: -77.0369, name: 'United States', region: 'Americas' },
    CA: { lat: 45.4215, lng: -75.6972, name: 'Canada', region: 'Americas' },
    MX: { lat: 19.4326, lng: -99.1332, name: 'Mexico', region: 'Americas' },
    BR: { lat: -15.7975, lng: -47.8919, name: 'Brazil', region: 'Americas' },
    AR: { lat: -34.6037, lng: -58.3816, name: 'Argentina', region: 'Americas' },
    CL: { lat: -33.4489, lng: -70.6693, name: 'Chile', region: 'Americas' },
    CO: { lat: 4.711, lng: -74.0721, name: 'Colombia', region: 'Americas' },

    // Asia-Pacific
    JP: { lat: 35.6762, lng: 139.6503, name: 'Japan', region: 'Asia-Pacific' },
    KR: { lat: 37.5665, lng: 126.978, name: 'South Korea', region: 'Asia-Pacific' },
    CN: { lat: 39.9042, lng: 116.4074, name: 'China', region: 'Asia-Pacific' },
    TW: { lat: 25.033, lng: 121.5654, name: 'Taiwan', region: 'Asia-Pacific' },
    SG: { lat: 1.3521, lng: 103.8198, name: 'Singapore', region: 'Asia-Pacific' },
    AU: { lat: -35.2809, lng: 149.13, name: 'Australia', region: 'Asia-Pacific' },
    NZ: { lat: -41.2865, lng: 174.7762, name: 'New Zealand', region: 'Asia-Pacific' },
    IN: { lat: 28.6139, lng: 77.209, name: 'India', region: 'Asia-Pacific' },
    TH: { lat: 13.7563, lng: 100.5018, name: 'Thailand', region: 'Asia-Pacific' },
    MY: { lat: 3.139, lng: 101.6869, name: 'Malaysia', region: 'Asia-Pacific' },
    ID: { lat: -6.2088, lng: 106.8456, name: 'Indonesia', region: 'Asia-Pacific' },
    PH: { lat: 14.5995, lng: 120.9842, name: 'Philippines', region: 'Asia-Pacific' },
    VN: { lat: 21.0278, lng: 105.8342, name: 'Vietnam', region: 'Asia-Pacific' },
    HK: { lat: 22.3193, lng: 114.1694, name: 'Hong Kong', region: 'Asia-Pacific' },

    // MENA
    AE: { lat: 24.4539, lng: 54.3773, name: 'UAE', region: 'MENA' },
    SA: { lat: 24.7136, lng: 46.6753, name: 'Saudi Arabia', region: 'MENA' },
    IL: { lat: 31.7683, lng: 35.2137, name: 'Israel', region: 'MENA' },
    TR: { lat: 39.9334, lng: 32.8597, name: 'Turkey', region: 'MENA' },
    EG: { lat: 30.0444, lng: 31.2357, name: 'Egypt', region: 'MENA' },
    QA: { lat: 25.2854, lng: 51.531, name: 'Qatar', region: 'MENA' },
    BH: { lat: 26.2285, lng: 50.586, name: 'Bahrain', region: 'MENA' },
    KW: { lat: 29.3759, lng: 47.9774, name: 'Kuwait', region: 'MENA' },
    OM: { lat: 23.588, lng: 58.3829, name: 'Oman', region: 'MENA' },
    JO: { lat: 31.9454, lng: 35.9284, name: 'Jordan', region: 'MENA' },
    IR: { lat: 35.6892, lng: 51.389, name: 'Iran', region: 'MENA' },
    IQ: { lat: 33.3152, lng: 44.3661, name: 'Iraq', region: 'MENA' },

    // Africa
    ZA: { lat: -25.7479, lng: 28.2293, name: 'South Africa', region: 'Africa' },
    NG: { lat: 9.0765, lng: 7.3986, name: 'Nigeria', region: 'Africa' },
    KE: { lat: -1.2921, lng: 36.8219, name: 'Kenya', region: 'Africa' },
    GH: { lat: 5.6037, lng: -0.187, name: 'Ghana', region: 'Africa' },
    MA: { lat: 33.9716, lng: -6.8498, name: 'Morocco', region: 'Africa' },
    ET: { lat: 9.025, lng: 38.7469, name: 'Ethiopia', region: 'Africa' },

    // Extra
    RU: { lat: 55.7558, lng: 37.6173, name: 'Russia', region: 'Europe' },
    UA: { lat: 50.4501, lng: 30.5234, name: 'Ukraine', region: 'Europe' },
    BY: { lat: 53.9006, lng: 27.559, name: 'Belarus', region: 'Europe' },
    PK: { lat: 33.6844, lng: 73.0479, name: 'Pakistan', region: 'Asia-Pacific' },
    KP: { lat: 39.0392, lng: 125.7625, name: 'North Korea', region: 'Asia-Pacific' },
};

/**
 * Get coordinates for a country code, falling back to [0,0] if unknown.
 */
export function getCountryCoords(countryCode: string): CountryCoord {
    return (
        COUNTRY_COORDS[countryCode.toUpperCase()] ?? {
            lat: 0,
            lng: 0,
            name: countryCode,
            region: 'Unknown',
        }
    );
}

/**
 * Jurisdiction color mapping for office pins.
 */
export function jurisdictionColor(jurisdiction: string): [number, number, number, number] {
    const colors: Record<string, [number, number, number, number]> = {
        EU: [59, 130, 246, 220],    // blue
        US: [34, 197, 94, 220],     // green
        UK: [239, 68, 68, 220],     // red
        APAC: [250, 204, 21, 220],  // yellow
        MENA: [249, 115, 22, 220],  // orange
        AFRICA: [168, 85, 247, 220], // purple
        LATAM: [20, 184, 166, 220], // teal
    };
    return colors[jurisdiction.toUpperCase()] ?? [148, 163, 184, 220]; // gray fallback
}
