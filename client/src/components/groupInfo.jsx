/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Cookies from 'js-cookie';

const GroupInfo = ({ theme, groupInfo, addMember }) => {
    const { name } = useParams();
    const navigate = useNavigate();
    const accessToken = Cookies.get('accessToken')
    const [groupDetails, setGroupDetails] = useState(null);
    const [newMember, setNewMember] = useState('');

    useEffect(() => {
        if (groupInfo) {
            setGroupDetails(groupInfo);
        } else {
            fetchGroupDetails(name);
        }
    }, [name, groupInfo]);

    const fetchGroupDetails = async (name) => {
        try {
            const response = await fetch(`http://localhost:3001/getGroup/${name}`, { headers: { 'accessToken': `${accessToken}` } });
            const data = await response.json();
            setGroupDetails(data);
        } catch (error) {
            console.error('Error fetching group details:', error);
        }
    };

    const handleAddMember = () => {
        if (newMember.trim()) {
            addMember(newMember.trim());
            setNewMember('');
        }
    };

    if (!groupDetails) {
        return <div>Loading...</div>;
    }

    return (
        <div className={`bg-gray-500 ${theme}`}>
            <div className='group-header'>
                <div className="avatar">
                    <div className="h-20 w-20 rounded-full ">
                        {groupDetails.imageData ? <img
                            src={`data:image/jpeg;base64,${groupDetails.imageData}`}
                            alt="Profile"
                            className="h-full w-full object-cover"
                        />
                            : <svg className="ml-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill={`${theme === 'dark-theme' ? 'white' : 'black'}`} d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-7 9c0-2.67 5.33-4 7-4s7 1.33 7 4v1H5v-1z" /></svg>
                        }
                    </div>
                </div>
                <h1>{groupDetails.name}</h1>
            </div>
            <div className='admin-info'>
                <h2>Admin</h2>
                <div className='admin-details'>
                    <img
                        src={groupDetails.admin.profilePhoto || '/default-user.png'}
                        alt={`${groupDetails.admin}'s profile`}
                        className='admin-profile-photo'
                    />
                    <span>{groupDetails.admin}</span>
                </div>
            </div>
            <div className='menu menu-lg'>
                <h2>Members</h2>
                <ul>
                    {groupDetails.members.map((member) => (
                        <li key={member.id}>
                            <img
                                src={member.profilePhoto || '/default-user.png'}
                                alt={`${member.name}'s profile`}
                                className='member-profile-photo'
                            />
                            {member.name}
                        </li>
                    ))}
                </ul>
            </div>
            <div className='add-member'>
                <h2>Add Member</h2>
                <input
                    type='text'
                    value={newMember}
                    onChange={(e) => setNewMember(e.target.value)}
                    placeholder='Enter username or email'
                />
                <button onClick={handleAddMember}>Add</button>
            </div>
        </div>
    );
};

export default GroupInfo;
