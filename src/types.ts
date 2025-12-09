export type ClientMessageType = 'join' | 'chat';

export interface JoinPayload {
    message: string;
}

export interface ChatPayload {
    message: string;
}

export type ClientMessage =
 | { type: 'join'; payload: { roomId: string } }
 | { type: 'chat'; payload: { message: string } };
 
export type ServerMessage = {
    type: 'chat';
    payload: { message: string };
}; 