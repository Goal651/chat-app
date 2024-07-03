/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

function CreateGroup() {
    const username = Cookies.get('username');
    const navigate = useNavigate();
    const [group, setGroup] = useState({ name: '', image: null });

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'image') {
            const file = files[0];
            setGroup({ ...group, image: file });
        } else {
            setGroup({ ...group, name: value });
        }
    };

    const sendData = async (e) => {
        e.preventDefault();
        const formDataToSend = new FormData();
        formDataToSend.append('name', group.name);
        formDataToSend.append('photo', group.image);
        formDataToSend.append('admin', username);
        try {
            const response = await fetch("http://localhost:3001/create-group", {
                method: "POST",
                body: formDataToSend
            });

            if (response.ok) {
                navigate('/');
            } else if (response.status === 400) {
                navigate('/group');
            } else if (response.status === 404) {
                alert('no stop there');
            } else {
                throw new Error("Something went wrong");
            }
        } catch (error) {
            console.error("Error submitting data:", error);
        }
    };

    return (
        <div className='createGroup'>
            <h1>Create Group</h1>
            <form onSubmit={sendData}>
                <label htmlFor="group">Group Name</label>
                <input type="text" id="group" name="group" value={group.name} onChange={handleChange} />
                <label htmlFor="image">Photo</label>
                <input type="file" name='image' onChange={handleChange} />
                <button type="submit">Create</button>
            </form>
        </div>
    );
}

export default CreateGroup;
