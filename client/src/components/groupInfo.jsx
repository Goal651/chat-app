/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Cookies from 'js-cookie';

const GroupInfo = ({ theme, groupInfo, dataFromGroupInfo }) => {
    const { name } = useParams();
    const navigate = useNavigate();
    const accessToken = Cookies.get('accessToken');
    const [groupDetails, setGroupDetails] = useState(null);
    const [newMember, setNewMember] = useState('');
    const [adminInfo, setAdminInfo] = useState('')

    useEffect(() => {
        if (groupInfo) setGroupDetails(groupInfo);
        else fetchGroupDetails(name);
    }, [name, groupInfo]);

    useEffect(() => {
        const getAdminInfo = async () => {
            if (groupDetails) {
                const admin = await groupDetails.members.filter(member => member.role === 'admin')
                setAdminInfo(admin[0])
            }
        }
        getAdminInfo()
    }, [groupDetails])

    const fetchGroupDetails = async (name) => {
        try {
            const response = await fetch(`http://localhost:3001/getGroup/${name}`, {
                headers: { 'accessToken': accessToken }
            });
            const data = await response.json();
            setGroupDetails(data.group); // Assuming the group data is returned in the "group" field
        } catch (error) { navigate('/error') }
    };



    const handleAddMember = async () => {
        if (newMember.trim()) {
            try {
                await addMember(name, newMember.trim());
                setNewMember('');
                fetchGroupDetails(name); // Refresh group details after adding a member
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
        if (!response.ok) { navigate('/error') }
        return response.json();
    };

    if (!groupDetails) {
        return <div className="text-center py-4">Loading...</div>;
    }
    const sendDataToGroupScreen = () => {
        dataFromGroupInfo(false)
    }

    return (
        <div className={`right-4 my-4 w-4/6 max-h-screen absolute p-6 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-black'} rounded-lg shadow-lg`}>
            <button onClick={sendDataToGroupScreen} className='btn btn-secondary  float-end'>✖</button>
            <div className="flex items-center space-x-4 mb-6">
                <div className="avatar">
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
                </div>
                <h1 className="text-2xl font-bold">{groupDetails.name}</h1>
            </div>
            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Admin</h2>
                <div className="flex items-center space-x-2">
                    <div className='avatar'>
                        <div className='rounded-full w-16 h-16'>
                            <img
                                src={`data:image/jpeg;base64,${adminInfo.imageData}`}
                                alt={`${groupDetails.admin.email}'s profile`}
                                className="h-full w-full"
                            />
                        </div>
                    </div>
                    <span>{adminInfo.username}</span>
                </div>
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
                        onChange={(e) => setNewMember(e.target.value)}
                        placeholder='Enter username or email'
                        className="input input-bordered w-full"
                    />
                    <button onClick={handleAddMember} className="btn btn-primary">Add</button>
                </div>
            </div>
        </div>
    );
};

export default GroupInfo;
