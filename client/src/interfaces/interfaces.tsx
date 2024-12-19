export interface User {
    id: string,
    username: string,
    names: string,
    email: string,
    password: string,
    image: string,
    imageData: string,
    lastActiveTime: Date,
    unreads: number,
    latestMessage: Message,
    privateKey: string
}


export interface Message {
    _id: string,
    sender: User,
    message: string,
    receiver: User,
    seen: boolean,
    edited: boolean,
    isMessageSent: boolean,
    reactions: string[],
    replying: string,
    type: string,
    timestamp: Date
}


export interface Group {
    _id: string;
    groupName: string;
    image: string
    description: string;
    members: User[];
    admins: User[];
    messages: Message[];
    createdTime: Date;
    latestMessage: GroupMessage | null;
    aesKey: string,
    iv: string,
    encryptedPrivateKey: string
}


export interface GroupMessage {
    _id: string,
    sender: User,
    message: string,
    group: Group,
    seen: {
        member: User,
        seenAt: Date
    },
    edited: boolean,
    isMessageSent: boolean,
    reactions: string[],
    replying: GroupMessage,
    type: string,
    createdAt: Date
}

export interface GroupMember {
    member: User
    role: string
}


