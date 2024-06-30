/* eslint-disable no-unused-vars */
import io from 'socket.io-client';
const socket = io.connect("http://localhost:3001", { withCredentials: true });
import React, { useState } from 'react';
import Feedback from './feedback';

function CreateGroup() {
    const [groupName, setGroup] = useState("");
    const [result, setResult] = useState("");
    const createRoom = () => {
        socket.emit("create_room", groupName);
    };
    socket.on('room_created', (roomName) => {
        console.log(`Room created: ${roomName}`);
        setResult({ type: 'success', message: `Room created: ${roomName}` });
    });

    socket.on('room_exists', (roomName) => {
        console.log(`Room already exists: ${roomName}`);
        setResult({ type: 'error', message: `Room already exists: ${roomName}` })
    });
    return (
        <div className='createGroup'>
            <h1>Create Group</h1>
            <form >
                <label htmlFor="group">Group Name</label>
                <input type="text" id="group" name="group" value={groupName} onChange={(e) => setGroup(e.target.value)} />
                <button type="button" onClick={() => createRoom()}>Create</button>
            </form>
            <Feedback data={result} />
        </div>
    )
}
export default CreateGroup;