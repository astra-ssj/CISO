import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OOBContact {
    id: string;
    name: string;
    role: string;
    status: 'ONLINE' | 'OFFLINE' | 'BUSY';
    avatarInitials: string;
}

export interface OOBMessage {
    id: string;
    senderId: 'user' | string;
    content: string;
    timestamp: number;
    isSystem: boolean; // For "Connection Established", "Encryption Handshake" etc.
}

interface OOBState {
    contacts: OOBContact[];
    messages: Record<string, OOBMessage[]>; // contactId -> messages
    activeContactId: string | null;
    isSecureLinkActive: boolean;

    // Actions
    activateSecureLink: () => void;
    deactivateSecureLink: () => void;
    selectContact: (contactId: string) => void;
    sendMessage: (content: string) => void;

    // Internal helper for simulation
    addMessage: (contactId: string, message: OOBMessage) => void;
}

const SECURE_CONTACTS: OOBContact[] = [
    { id: 'ceo', name: 'Margaret Theron', role: 'Chief Executive Officer', status: 'ONLINE', avatarInitials: 'MT' },
    { id: 'legal', name: 'Simon Weiss', role: 'General Counsel', status: 'BUSY', avatarInitials: 'SW' },
    { id: 'gov', name: 'Agent K.', role: 'FBI Liaison / Cyber Division', status: 'ONLINE', avatarInitials: 'AK' },
    { id: 'pr', name: 'Elena Rostova', role: 'Crisis PR Lead', status: 'OFFLINE', avatarInitials: 'ER' },
];

const SIMULATED_RESPONSES: Record<string, string[]> = {
    'ceo': [
        "Understood. What is our exposure?",
        "Do we need to issue a press release yet?",
        "Authorize whatever you need to contain this. Just keep the stock price in mind.",
        "I'm in a board meeting, keep me posted on the hour.",
        "Approved. Execute immediately."
    ],
    'legal': [
        "Be careful with that wording. We don't want to admit liability.",
        "Check the cyber insurance policy clause 4.2 before proceeding.",
        "I'm drafting the notification to the regulators now.",
        "Do NOT pay the ransom without my sign-off.",
        "Preserve all evidence. Chain of custody is critical."
    ],
    'gov': [
        "We are tracking similar signatures from APT-29.",
        "Send us the PCAP files via the secure drop.",
        "Do not engage with the threat actor directly.",
        "We can deploy a response team within 4 hours if requested.",
        "Acknowledged. Standby."
    ]
};

export const useOOBStore = create<OOBState>()(
    persist(
        (set, get) => ({
            contacts: SECURE_CONTACTS,
            messages: {},
            activeContactId: null,
            isSecureLinkActive: false,

            activateSecureLink: () => set({ isSecureLinkActive: true }),
            deactivateSecureLink: () => set({ isSecureLinkActive: false, activeContactId: null }),

            selectContact: (contactId) => set((state) => {
                // Initialize chat history if empty
                if (!state.messages[contactId]) {
                    return {
                        activeContactId: contactId,
                        messages: {
                            ...state.messages,
                            [contactId]: [
                                {
                                    id: 'sys-start',
                                    senderId: 'system',
                                    content: `Establishing End-to-End Encryption with ${SECURE_CONTACTS.find(c => c.id === contactId)?.name}...`,
                                    timestamp: Date.now(),
                                    isSystem: true
                                },
                                {
                                    id: 'sys-verify',
                                    senderId: 'system',
                                    content: `Identity Verified. Channel Secure.`,
                                    timestamp: Date.now() + 500,
                                    isSystem: true
                                }
                            ]
                        }
                    };
                }
                return { activeContactId: contactId };
            }),

            addMessage: (contactId, message) => set((state) => ({
                messages: {
                    ...state.messages,
                    [contactId]: [...(state.messages[contactId] || []), message]
                }
            })),

            sendMessage: (content) => {
                const { activeContactId, addMessage } = get();
                if (!activeContactId) return;

                // User Message
                const userMsg: OOBMessage = {
                    id: `msg-${Date.now()}`,
                    senderId: 'user',
                    content,
                    timestamp: Date.now(),
                    isSystem: false
                };
                addMessage(activeContactId, userMsg);

                // Simulated Reply
                setTimeout(() => {
                    const replies = SIMULATED_RESPONSES[activeContactId] || ["Received."];
                    const randomReply = replies[Math.floor(Math.random() * replies.length)];

                    const replyMsg: OOBMessage = {
                        id: `rep-${Date.now()}`,
                        senderId: activeContactId,
                        content: randomReply,
                        timestamp: Date.now(),
                        isSystem: false
                    };
                    addMessage(activeContactId, replyMsg);
                }, 2000 + Math.random() * 3000); // 2-5s delay
            }
        }),
        {
            name: 'astra-oob-store'
        }
    )
);
