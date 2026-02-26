export interface RansomwareVictim {
    id: string;
    post_title: string;
    group_name: string;
    published: string;
    website?: string;
    description?: string;
    screenshot_url?: string;
    country?: string;
}

export interface RansomwareGroup {
    name: string;
    victim_count: number;
    last_active: string;
    description?: string;
}

export interface RansomwareStats {
    total_victims_24h: number;
    total_victims_7d: number;
    active_groups: number;
    top_target_country: string;
}

export interface RansomwareFeedData {
    victims: RansomwareVictim[];
    groups: RansomwareGroup[];
    stats: RansomwareStats;
    last_updated: string;
    /** Raw MalwareBazaar samples for table view (when fetched from live API) */
    rawSamples?: unknown[];
    /** Count of samples specifically identified as ransomware */
    ransomwareCount?: number;
}
