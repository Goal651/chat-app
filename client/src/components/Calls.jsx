/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from "react";

export default function Calls({ socket, type, endingCall }) {
    const friend = localStorage.getItem('selectedFriend');
    const info = JSON.parse(sessionStorage.getItem(`friend-${friend}`));
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [peerConnection, setPeerConnection] = useState(null);
    const [callType, setCallType] = useState(null);
    const [isCalling, setIsCalling] = useState(false);
    const [incomingCall, setIncomingCall] = useState(null); // Track incoming calls

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    const ICE_SERVERS = {
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
        ],
    };

    useEffect(() => {
        if (type) {
            startCall(type);
        }
    }, [type]);

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
        setIncomingCall(null); // Clear incoming call
        endingCall('');
    };

    const handleAnswerCall = async () => {
        const { offer, sender, type } = incomingCall;
        setCallType(type);
        setIsCalling(true);

        const pc = createPeerConnection(sender);
        setPeerConnection(pc);

        try {
            let stream;
            if (type === 'video') {
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(stream);
                localVideoRef.current.srcObject = stream;
                stream.getTracks().forEach(track => pc.addTrack(track, stream));
            } else {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                setLocalStream(stream);
                stream.getTracks().forEach(track => pc.addTrack(track, stream));
            }

            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.emit('call-answer', { answer, sender });
            setIncomingCall(null); // Clear the incoming call notification
        } catch (error) {
            console.error("Error answering call:", error);
            endCall();
        }
    };

    useEffect(() => {
        const handleCallOffer = ({ offer, sender, type }) => {
            setIncomingCall({ offer, sender, type });
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
        socket.on('call_ended', endCall);

        return () => {
            socket.off('call-offer', handleCallOffer);
            socket.off('call-answer', handleCallAnswer);
            socket.off('ice-candidate', handleICECandidate);
        };
    }, [socket, peerConnection]);

    return (
        <div>
            {incomingCall && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg overflow-hidden w-full max-w-md">
                        <div className="p-4 flex flex-col items-center">
                            <div className="text-lg font-semibold mb-4">
                                Incoming {incomingCall.type === 'video' ? 'Video Call' : 'Audio Call'} from {info.username || friend}
                            </div>
                            <div className="flex space-x-4">
                                <button
                                    onClick={handleAnswerCall}
                                    className="p-3 bg-green-500 rounded-full hover:bg-green-600 focus:outline-none"
                                >
                                    ✅ Answer
                                </button>
                                <button
                                    onClick={endCall}
                                    className="p-3 bg-red-500 rounded-full hover:bg-red-600 focus:outline-none"
                                >
                                    ❌ Reject
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isCalling && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg overflow-hidden w-full max-w-2xl shadow-lg">
                        {/* Call UI Header */}
                        <div className="flex items-center justify-between bg-gray-800 text-white p-4">
                            <div className="font-bold">
                                {callType === "video" ? "Video Call" : "Audio Call"} with{" "}
                                {info.username || friend}
                            </div>
                            <button
                                onClick={endCall}
                                className="p-2 rounded-full bg-red-600 hover:bg-red-700"
                            >
                                ✖
                            </button>
                        </div>

                        {/* Call Content */}
                        <div className="p-4">
                            {callType === "video" ? (
                                <div className="flex flex-col items-center space-y-4">
                                    {/* Remote Video */}
                                    <video
                                        ref={remoteVideoRef}
                                        autoPlay
                                        playsInline
                                        className="w-full h-64 bg-black rounded-lg"
                                    />
                                    {/* Local Video */}
                                    <video
                                        ref={localVideoRef}
                                        autoPlay
                                        playsInline
                                        className="w-32 h-32 bg-black rounded-lg"
                                    />
                                </div>
                            ) : (
                                <div className="text-center text-lg font-semibold">
                                    You are in an audio call with {info.username || friend}.
                                </div>
                            )}
                        </div>

                        {/* Call Controls */}
                        <div className="flex justify-center p-4 bg-gray-100 space-x-4">
                            <button
                                onClick={endCall}
                                className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none"
                            >
                                End Call
                            </button>
                            <button
                                onClick={() => console.log("Mute functionality here")}
                                className="p-3 bg-gray-300 text-gray-800 rounded-full hover:bg-gray-400 focus:outline-none"
                            >
                                Mute
                            </button>
                            <button
                                onClick={() => console.log("Video toggle functionality here")}
                                className={`p-3 ${callType === "video" ? "bg-gray-300" : "bg-gray-200"
                                    } text-gray-800 rounded-full hover:bg-gray-400 focus:outline-none`}
                            >
                                {callType === "video" ? "Turn Off Video" : "Video Unavailable"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
