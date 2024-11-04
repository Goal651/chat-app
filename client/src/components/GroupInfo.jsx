/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Cookies from 'js-cookie';

export default function  GroupInfo  ({ theme, groupInfo,  })  {
    const { group_name } = useParams();
    const navigate = useNavigate();
    const accessToken = Cookies.get('accessToken');
    const [groupDetails, setGroupDetails] = useState(null);
    const [newMember, setNewMember] = useState('');
    const [file, setFile] = useState([])
    const [filePreview, setFilePreview] = useState('')

    useEffect(() => {
        if (groupInfo) setGroupDetails(groupInfo);
        else fetchGroupDetails(group_name);
    }, [group_name, groupInfo]);


    const fetchGroupDetails = async (name) => {
        try {
            const response = await fetch(`https://chat-app-production-2663.up.railway.app/getGroup/${name}`, {
                headers: { 'accessToken': accessToken }
            });
            const data = await response.json()
            setGroupDetails(data.group)
        } catch (error) { navigate('/error') }
    };


    const handleAddMember = async () => {
        if (newMember.trim()) {
            try {
                await addMember(group_name, newMember.trim());
                setNewMember('');
                fetchGroupDetails(group_name)
            } catch (error) { navigate('/error') }
        }
    };

    const addMember = async (groupName, memberEmail) => {
        const response = await fetch('https://chat-app-production-2663.up.railway.app/addMember', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'accessToken': accessToken
            },
            body: JSON.stringify({ groupName, memberEmail })
        });
        const data = await response.json()
        if (response.status === 401) {
            Cookies.set("accessToken", data.accessToken);
        } else if (response.status === 403 || response.status === 403) {
            Cookies.remove('accessToken')
            navigate("/login")
        }
        else if (response.ok) return data
        else navigate('/error')
    }

    const handleEditing = async () => {
        const fileInput = document.getElementById('file')
        fileInput.click()
    }

    const handleChange = (e) => {
        const { name, value, files } = e.target
        if (name === 'file') {
            const file = files[0]
            setFile(file)
            setFilePreview(URL.createObjectURL(file))
        } else setNewMember(value)
    }

    const handleCancel = () => {
        setFile([])
        setFilePreview('')
    }

    const handleProfileEdit = async () => {
        try {
            const formDataToSend = new FormData();
            formDataToSend.append("image", file);
            if (!file) return
            const response = await fetch(`https://chat-app-production-2663.up.railway.app/updateGroupProfile/${group_name}`, {
                headers: { 'accessToken': `${accessToken}` },
                body: formDataToSend,
                method: 'PUT'
            })
            if (response.status === 200) {
                handleCancel()
                fetchGroupDetails(group_name)
            }

        } catch (err) { console.error(err) }
    }

    if (!groupDetails) {
        return <div className="text-center py-4">Loading...</div>;
    }



    return (
        <div className={`overflow-y-auto`}>
            <div className="mb-6">
                <h2 className=" font-semibold mb-2">{groupDetails.members.length} members</h2>
                <ul className="space-y-2">
                    {groupDetails.members.map((member) => (
                        <li key={member.email} className="flex items-center space-x-2">
                            <div className='avatar'>
                                <div className='rounded-full w-10 h-10'>
                                    <img
                                        src={member.imageData}
                                        alt={`${groupDetails.admin.email}'s profile`}
                                        className="h-full w-full"
                                    />
                                </div>
                            </div>
                            <span className='font-semibold text-sm'>{member.username}</span>
                            {member.role === 'admin' && (<div className='text-indigo-400 text-sm'>admin</div>)}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="mb-4">
                <h2 className="text-sm font-semibold mb-2">Add Member</h2>
                <div className="flex space-x-2">
                    <input
                        type='text'
                        value={newMember}
                        onChange={handleChange}
                        placeholder='Enter username or email'
                        className="input input-bordered w-full"
                    />
                    <button onClick={handleAddMember} className="btn btn-primary">Add</button>
                </div>
            </div>
            {filePreview && (
                <div className="fixed flex flex-col justify-center bg-black h-screen w-screen rounded-box top-0 left-0">
                    <div className="relative m-8 ml-72 w-full">
                        {filePreview && (<img src={filePreview} alt="Image Preview" className="max-h-96 max-w-xl rounded-box" />)}
                    </div>
                    <div className="flex space-x-10 relative justify-center">
                        <button onClick={handleCancel} className="btn text-gray-400">Cancel</button>
                        <button onClick={handleProfileEdit} className="btn btn-success">Save</button>
                    </div>
                </div>)}
        </div>
    );
}