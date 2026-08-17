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
    isSystem: boolean;
}

interface OOBState {
    contacts: OOBContact[];
    messages: Record<string, OOBMessage[]>;
    activeContactId: string | null;
    isSecureLinkActive: boolean;
    activateSecureLink: () => void;
    deactivateSecureLink: () => void;
    selectContact: (contactId: string) => void;
    sendMessage: (content: string) => void;
    addMessage: (contactId: string, message: OOBMessage) => void;
}

const SECURE_CONTACTS: OOBContact[] = [
    { id: 'ceo', name: 'Exercise: CEO seat', role: 'Exercise roster (not a live person)', status: 'OFFLINE', avatarInitials: 'EX' },
    { id: 'legal', name: 'Exercise: Legal seat', role: 'Exercise roster (not a live person)', status: 'OFFLINE', avatarInitials: 'EX' },
    { id: 'gov', name: 'Exercise: Liaison seat', role: 'Exercise roster (not a live person)', status: 'OFFLINE', avatarInitials: 'EX' },
    { id: 'pr', name: 'Exercise: PR seat', role: 'Exercise roster (not a live person)', status: 'OFFLINE', avatarInitials: 'EX' },
];

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
                if (!state.messages[contactId]) {
                    return {
                        activeContactId: contactId,
                        messages: {
                            ...state.messages,
                            [contactId]: [
                                {
                                    id: 'sys-start',
                                    senderId: 'system',
                                    content: `Exercise channel with ${SECURE_CONTACTS.find(c => c.id === contactId)?.name}. Not a live person.`,
                                    timestamp: Date.now(),
                                    isSystem: true,
                                },
                            ],
                        },
                    };
                }
                return { activeContactId: contactId };
            }),

            addMessage: (contactId, message) => set((state) => ({
                messages: {
                    ...state.messages,
                    [contactId]: [...(state.messages[contactId] || []), message],
                },
            })),

            sendMessage: (content) => {
                const { activeContactId, addMessage } = get();
                if (!activeContactId) return;
                addMessage(activeContactId, {
                    id: `msg-${Date.now()}`,
                    senderId: 'user',
                    content,
                    timestamp: Date.now(),
                    isSystem: false,
                });
            },
        }),
        { name: 'astra-oob-store' },
    ),
);
