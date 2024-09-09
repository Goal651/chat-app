/* eslint-disable no-unused-vars */
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Cookies from 'js-cookie'

export default function CreateGroup() {

    const navigate = useNavigate()
    const accessToken=Cookies.get('accessToken')
    const [group, setGroup] = useState({ name: '', image: null })

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'image') {
            const file = files[0];
            setGroup({ ...group, image: file });
        } else setGroup({ ...group, name: value });
    };

    const sendData = async (e) => {
        e.preventDefault();
        const formDataToSend = new FormData();
        formDataToSend.append('name', group.name);
        formDataToSend.append('photo', group.image);
        try {
            const response = await fetch("http://localhost:3001/create-group", { headers: { 'accessToken': ` ${accessToken}` } , method: "POST", body: formDataToSend })
            if (response.ok) navigate('/group');
            else if (response.status === 400) navigate('/group');
            else if (response.status === 404) alert('no stop there');
            else throw new Error("Something went wrong");
        } catch (error) { navigate('/error') }
    };

    return (
        <div className='form form-control'>
            <h1 className='font-bold text-2xl my-5'>Create Group</h1>
            <form onSubmit={sendData}>
                <label htmlFor="group">Group Name</label>
                <input type="text" id="group" name="group" value={group.name} onChange={handleChange} className='input bg-transparent border-blue-700' />
                <label htmlFor="image">Photo</label>
                <input type="file" name='image' onChange={handleChange} className='file-input file-input-accent bg-accent' />
                <button type="submit" className='btn m-5'>Create</button>
            </form>
        </div>
    );
}