/* eslint-disable no-unused-vars */
import io from 'socket.io-client';
const socket = io.connect("http://localhost:3001", { withCredentials: true });
import React, { useEffect, useState } from 'react';
import Feedback from './feedback';
import Cookies from 'js-cookie';

function JoinGroup() {

    useEffect(() => {
        const email = Cookies.get('email');
        if (!email) { window.location.href = '/login'; }
        setUser(email);
    }, []);


    const [groupName, setGroup] = useState("");
    const [result, setResult] = useState("");
    const [user, setUser] = useState("");
    const joinRoom = () => {
        socket.emit("join_room", { joiner: user, roomName: groupName });
    };
    socket.on('room_joined', (roomName) => {
        console.log(`Room created: ${roomName}`);
        setResult({ type: 'success', message: `Room created: ${roomName}` });
    });

    socket.on('room_exists', (roomName) => {
        console.log(`Room already exists: ${roomName}`);
        setResult({ type: 'error', message: `Room already exists: ${roomName}` })
    });

    return (
        <div className='createGroup'>
            <h1>Join Group</h1>
            <form>
                <label htmlFor="group">Group Name</label>
                <input type="text" id="group" name="group" value={groupName} onChange={(e) => setGroup(e.target.value)} />
                <button type="button" onClick={() => joinRoom()}>Join</button>
            </form>
            <Feedback data={result} />
        </div>
    )
}
export default JoinGroup;