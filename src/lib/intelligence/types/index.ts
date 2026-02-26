/**
 * Shared Threat Intelligence types + barrel re-exports.
 */

export type { ThreatIntelProvider } from './unified-types';

// Keep backward compat — existing code uses ThreatIntelSource
export type ThreatIntelSource = 'OPENCTI' | 'MISP' | 'OTX' | 'ABUSECH_URLHAUS' | 'ABUSECH_THREATFOX' | 'ABUSECH_MALWAREBAZAAR' | 'COMBINED';

// OpenCTI types
export type {
    StixCoreObject,
    OpenCTIFilters,
    PaginatedResponse,
    Campaign,
    ThreatActor,
    Indicator,
    IndicatorType,
    IndicatorTypeShort,
    AttackPattern,
    AttackHeatmapEntry,
    Malware,
    Report,
    SearchResult,
    OpenCTIStats,
    OpenCTIHealthCheck,
} from './opencti-types';

// MISP types
export type {
    MISPEvent,
    MISPEventFilters,
    MISPAttribute,
    MISPAttributeCategory,
    MISPAttributeType,
    MISPAttributeFilters,
    MISPFeed,
    MISPFeedStatus,
    MISPTag,
    MISPGalaxy,
    MISPGalaxyCluster,
    MISPStats,
    MISPHealthCheck,
} from './misp-types';

// AlienVault OTX types
export type {
    OTXPulse,
    OTXIndicator,
    OTXIndicatorType,
    OTXIPReport,
    OTXDomainReport,
    OTXHashReport,
    OTXURLReport,
    OTXValidation,
    OTXStats,
    OTXHealthCheck,
} from './otx-types';

// Abuse.ch types
export type {
    MaliciousURL,
    URLhausPayload,
    URLhausResult,
    ThreatFoxIOC,
    MalwareSample,
    MalwareBazaarResult,
    AbuseCHStats,
    AbuseCHHealthCheck,
} from './abusech-types';

// Unified (provider-agnostic) types
export type {
    IOCType,
    IOCSeverity,
    UnifiedIOC,
    EnrichmentVerdict,
    EnrichmentSourceResult,
    EnrichmentResult,
    IntelDashboard,
    IntelThreatSummary,
    IntelProviderStatus,
    IntelHealth,
} from './unified-types';

// Shodan types
export type {
    ShodanHostResult,
    ShodanService,
    ShodanHostMinimal,
    ShodanSearchResult,
    ShodanDomainResult,
    ShodanCVEResult,
    ShodanAccountInfo,
    ShodanHealthCheck,
    AttackSurfaceReport,
    VendorScanResult,
} from './shodan-types';
