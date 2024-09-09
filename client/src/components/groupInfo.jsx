/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Cookies from 'js-cookie';

export default function  GroupInfo  ({ theme, groupInfo, dataFromGroupInfo, })  {
    const { name } = useParams();
    const navigate = useNavigate();
    const accessToken = Cookies.get('accessToken');
    const [groupDetails, setGroupDetails] = useState(null);
    const [newMember, setNewMember] = useState('');
    const [file, setFile] = useState([])
    const [filePreview, setFilePreview] = useState('')

    useEffect(() => {
        if (groupInfo) setGroupDetails(groupInfo);
        else fetchGroupDetails(name);
    }, [name, groupInfo]);


    const fetchGroupDetails = async (name) => {
        try {
            const response = await fetch(`http://localhost:3001/getGroup/${name}`, {
                headers: { 'accessToken': accessToken }
            });
            const data = await response.json()
            setGroupDetails(data.group)
        } catch (error) { navigate('/error') }
    };


    const handleAddMember = async () => {
        if (newMember.trim()) {
            try {
                await addMember(name, newMember.trim());
                setNewMember('');
                fetchGroupDetails(name)
            } catch (error) { navigate('/error') }
        }
    };

    const addMember = async (groupName, memberEmail) => {
        const response = await fetch('http://localhost:3001/addMember', {
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
    };
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
            const response = await fetch(`http://localhost:3001/updateGroupProfile/${name}`, {
                headers: { 'accessToken': `${accessToken}` },
                body: formDataToSend,
                method: 'PUT'
            })
            if (response.status === 200) {
                handleCancel()
                fetchGroupDetails(name)
            }

        } catch (err) { console.error(err) }
    }

    if (!groupDetails) {
        return <div className="text-center py-4">Loading...</div>;
    }
    const sendDataToGroupScreen = () => dataFromGroupInfo(false)



    return (
        <div className={`right-4 my-4 w-4/6 max-h-screen fixed p-6 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-black'} rounded-lg shadow-lg overflow-y-auto`}>
            <button onClick={sendDataToGroupScreen} className='btn btn-secondary  float-end'>✖</button>
            <div className="flex items-center space-x-4 mb-6">
                <div
                    onClick={handleEditing}
                    className="avatar">
                    <div className="h-20 w-20 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                        {groupDetails.imageData ? (
                            <img
                                src={`data:image/jpeg;base64,${groupDetails.imageData}`}
                                alt="Group Profile"
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                <path fill={`${theme === 'dark' ? 'white' : 'black'}`} d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-7 9c0-2.67 5.33-4 7-4s7 1.33 7 4v1H5v-1z" />
                            </svg>
                        )}
                    </div>
                    <input
                        id='file'
                        type="file"
                        name='file'
                        className='hidden'
                        onChange={handleChange} />
                </div>
                <h1 className="text-2xl font-bold">{groupDetails.name}</h1>
            </div>
            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Members</h2>
                <ul className="space-y-2">
                    {groupDetails.members.map((member) => (
                        <li key={member.email} className="flex items-center space-x-2">
                            <div className='avatar'>
                                <div className='rounded-full w-16 h-16'>
                                    <img
                                        src={`data:image/jpeg;base64,${member.imageData}`}
                                        alt={`${groupDetails.admin.email}'s profile`}
                                        className="h-full w-full"
                                    />
                                </div>
                            </div>
                            <span className='font-semibold'>{member.username}</span>
                            {member.role === 'admin' && (<div className='text-indigo-400'>admin</div>)}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Add Member</h2>
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