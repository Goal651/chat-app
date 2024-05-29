/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import io from 'socket.io-client';
import Cookies from 'js-cookie';

const DMArea = ({ chat }) => {
    const [socket, setSocket] = useState(null);
    const [refresh, setRefresh] = useState(false);
    const [message, setMessage] = useState("");
    const [messageReceived, setMessageReceived] = useState([]);
    const [user, setUser] = useState("");
    const [history, setHistory] = useState([]);

    useEffect(() => {
      
        // Establish socket connection when the component mounts
        const newSocket = io("http://localhost:3001", { withCredentials: true });
        setSocket(newSocket);

        return () => {
          
            if (socket) {
                socket.disconnect();
            }
        };
    }, []);

    useEffect(() => {
        // Handle socket events and emit messages
        if (!socket) return;

        const username = Cookies.get('username');
        setUser(username);

        socket.on("receive_message", (data) => {
            alert(data.message);
            setMessageReceived(data);
        });

        socket.on("joined_room", (data) => {
            // Additional logic for joined room event
        });

        // Cleanup socket event listeners when component unmounts
        return () => {
            socket.off('receive_message');
            socket.off('joined_room');
        };
    }, [socket]);

    useEffect(() => {
        // Fetch message history when chat or refresh state changes
        const fetchMessage = async () => {
            const username = Cookies.get('username');
            const response = await fetch(`http://localhost:3001/message?sender=${username}&receiver=${chat}`);
            const data = await response.json();
            const message = data.messages;
            setHistory(message);
        };
        fetchMessage();
    }, [chat, refresh]);

    const sendMessage = (e) => {
        e.preventDefault();
        socket.emit("send_message", { receiver: chat, message, sender: user });
        setMessage("");
        setRefresh(!refresh);
    };

    return (
        <div id="chatArea">
            <div className="chatArea_container">
                <div className="chatArea_header">
                    <h1>{chat}</h1>
                    <h2>{messageReceived.message}</h2>
                </div>
                <div className="chatArea_body">
                    <div className="chatArea_history">
                        {history && history.length > 0 ? (
                            history.map((message) => (
                                message.sender === user ? (
                                    <div className="history" key={message._id} >
                                        <div id="chat-Sender">{message.message}</div>
                                    </div>
                                ) : (
                                    <div className="history" key={message._id}  >
                                        <div id="chat-Receiver">
                                            {message.message}
                                        </div>
                                    </div>
                                )

                            ))
                        ) : (
                            <div style={{ textAlign: 'center', fontSize: '2rem', fontFamily: '700', background: 'linear-gradient(to right,red,blue,white)', color: 'transparent', backgroundClip: 'text' }}>No friend selected!</div>)
                        }
                        
                    </div>

                </div>

                <div  className="chatArea_footer">
                    <form onSubmit={sendMessage}>
                        <input type="text" placeholder="Enter message" value={message} onChange={(e) => setMessage(e.target.value)} />
                        <button type="submit">
                            <img src="send.png" alt="hjk" width={'40rem'} /></button>
                    </form>
                </div>
            </div>
        </div >
    );
};

export default DMArea;
