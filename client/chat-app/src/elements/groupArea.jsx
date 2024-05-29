/* eslint-disable no-undef */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useState } from "react";
import MessageContainer from "./messageContainer";
import { useNavigate } from "react-router-dom";

const GroupArea = () => {
    const navigate = useNavigate();
    const [message, setMessage] = useState("");
    const [friend, setFriend] = useState("");
    const [joiner, setJoiner] = useState("");
    const [user, setUser] = useState("");
    const [history, setHistory] = useState([]);


  
    return (
        <div id="chatArea">
            <div className="chatArea_container">
                <div>{joiner}</div>
                <div className="chatArea_header">
                    <h1>Chat App</h1>
                </div>
                <div className="chatArea_body">
                    <div className="chatArea_history">
                        {history.map((message) => (
                            <MessageContainer key={message._id} history={message} />
                        ))}
                    </div>
                </div>
                <div className="chatArea_footer">
                    <input type="text" placeholder="Enter username" onChange={(e) => setFriend(e.target.value)} />
                    <button onClick={joinRoom}>Join room</button>
                    <input type="text" placeholder="Enter message" onChange={(e) => setMessage(e.target.value)} />
                    <button onClick={sendMessage}>Send</button>
                </div>
            </div>
        </div >
    );
};

export default GroupArea;
