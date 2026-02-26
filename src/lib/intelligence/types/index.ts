/**
 * Shared Threat Intelligence types + barrel re-exports.
 */

export type ThreatIntelSource = 'OPENCTI' | 'MISP' | 'COMBINED';

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
