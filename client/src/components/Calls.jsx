/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from "react"

export default function Calls({ socket, type, endingCall }) {
    const friend = localStorage.getItem('selectedFriend');
    const info = JSON.parse(sessionStorage.getItem(`friend-${friend}`))
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [peerConnection, setPeerConnection] = useState(null);
    const [callType, setCallType] = useState(null);
    const [isCalling, setIsCalling] = useState(false);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    const ICE_SERVERS = {
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
        ],
    };
    useEffect(() => {
        if (type) {
            startCall(type)
        }
    }, [type])

    const startCall = async (type) => {
        setCallType(type);
        setIsCalling(true);

        const pc = createPeerConnection(friend);
        setPeerConnection(pc);

        try {
            let stream;
            if (type === 'video') {
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                localVideoRef.current.srcObject = stream;
            } else {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            }
            setLocalStream(stream);
            stream.getTracks().forEach((track) => pc.addTrack(track, stream));
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('call-offer', { offer, receiver: friend, type });
        } catch (error) {
            console.error("Error starting call:", error);
            endCall();
        }
    };


    const createPeerConnection = (peerId) => {
        const pc = new RTCPeerConnection(ICE_SERVERS);
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice-candidate', {
                    candidate: event.candidate,
                    to: peerId,
                });
            }
        };

        pc.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                endCall();
            }
        };

        return pc;
    };


    const endCall = () => {
        if (peerConnection) {
            peerConnection.close();
            setPeerConnection(null);
        }
        if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
            setLocalStream(null);
        }
        if (remoteStream) {
            remoteStream.getTracks().forEach((track) => track.stop());
            setRemoteStream(null);
        }
        setIsCalling(false);
        setCallType(null);
        endingCall('')
    };


    useEffect(() => {
        const handleCallOffer = async ({ offer, sender, type }) => {
            if (sender !== friend) return;
            setCallType(type);
            setIsCalling(true);

            const pc = createPeerConnection(sender);
            setPeerConnection(pc);

            try {
                if (type === 'video') {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    setLocalStream(stream);
                    localVideoRef.current.srcObject = stream;
                    stream.getTracks().forEach(track => pc.addTrack(track, stream));
                } else {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    setLocalStream(stream);
                    stream.getTracks().forEach(track => pc.addTrack(track, stream));
                }

                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                socket.emit('call-answer', { answer, sender });
            } catch (error) {
                console.error("Error handling call offer:", error);
            }
        };
        const handleCallAnswer = async ({ answer }) => {
            try {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            } catch (error) {
                console.error("Error setting remote description from answer:", error);
            }
        };

        const handleICECandidate = ({ candidate }) => {
            try {
                peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (error) {
                console.error("Error adding received ICE candidate:", error);
            }
        };

        socket.on('call-offer', handleCallOffer);
        socket.on('call-answer', handleCallAnswer);
        socket.on('ice-candidate', handleICECandidate);
        socket.on('call_ended', endCall)

        return () => {
            socket.off('call-offer', handleCallOffer);
            socket.off('call-answer', handleCallAnswer);
            socket.off('ice-candidate', handleICECandidate);
        }
    }, [socket])


    return (
        <div>
            {isCalling && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg overflow-hidden w-full max-w-2xl">
                        <div className="flex justify-between items-center p-4 bg-gray-800">
                            <div className="text-white font-semibold">
                                {callType === 'video' ? 'Video Call' : 'Audio Call'} with {info.username || friend}
                            </div>
                            <button
                                onClick={endCall}
                                className="text-red-500 hover:text-red-700 focus:outline-none"
                            >
                                ✖
                            </button>
                        </div>
                        <div className="p-4">
                            {callType === 'video' ? (
                                <div className="flex flex-col items-center space-y-4">
                                    <video
                                        ref={remoteVideoRef}
                                        autoPlay
                                        playsInline
                                        className="w-full h-64 bg-black rounded-lg"
                                    />
                                    <video
                                        ref={localVideoRef}
                                        autoPlay
                                        playsInline
                                        className="w-32 h-32 bg-black rounded-lg"
                                    />

                                </div>
                            ) : (
                                <div className="flex flex-col items-center space-y-4">
                                    <div className="w-32 h-32 bg-gray-300 rounded-full flex items-center justify-center">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="currentColor"
                                            className="w-16 h-16 text-gray-500"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M6.62 10.79a15.05 15.05 0 006.58 6.58l2.2-2.2a1 1 0 011.11-.21 12.38 12.38 0 004.55 1.45 1 1 0 01.89 1v3.75a1 1 0 01-1 1A18 18 0 013 5a1 1 0 011-1h3.75a1 1 0 011 .89 12.38 12.38 0 001.45 4.55 1 1 0 01-.21 1.11l-2.2 2.2z" />
                                        </svg>
                                        <audio
                                            ref={remoteStream}
                                            autoPlay
                                            controls
                                        />
                                    </div>
                                    <div className="text-lg font-semibold">{info.username || friend}</div>
                                    <div className="text-gray-500">Audio Call</div>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-center p-4 bg-gray-100">
                            <button
                                onClick={endCall}
                                className="p-3 bg-red-500 rounded-full hover:bg-red-600 focus:outline-none"
                            >
                                ✖ End Call
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}