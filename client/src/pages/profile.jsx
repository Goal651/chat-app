/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";


const Profile = ({ dataFromProfile, theme ,isMobile}) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const accessToken = Cookies.get("accessToken");
    const [profile, setProfile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [editing, setEditing] = useState(false);
    const [reload, setReload] = useState(false);

    useEffect(() => { if (!accessToken) navigate("/login") }, [navigate, accessToken]);
    useEffect(() => {
        const fetchUserDetails = async () => {
            if (!accessToken) return
            try {
                const response = await fetch(`http://localhost:3001/getUserProfile`, { headers: { accessToken: `${accessToken}` }, });
                const data = await response.json();
                if (response.status === 401) {
                    Cookies.set("accessToken", data);
                    window.location.reload();
                } else if (response.status === 403) navigate("/login");
                else if (response.ok) setUser(data.user)
            } catch (error) { navigate("/error"); console.log(error) }
        }
        fetchUserDetails()
    }, [accessToken, reload, navigate]);

    const sendDataToDashboard = () => dataFromProfile(true);

    const handleEdit = async () => {
        try {
            const formDataToSend = new FormData();
            formDataToSend.append("image", profile);
            const response = await fetch("http://localhost:3001/editUser/profile", { headers: { accessToken: `${accessToken}` }, method: "PUT", body: formDataToSend, });
            const newAccessToken = await response.json();
            if (response.status === 401) {
                Cookies.set("accessToken", newAccessToken);
                window.location.reload();
            } else if (response.status === 403) navigate("/login");
            else if (response.ok) {
                setEditing(false);
                setReload(true);
                sendDataToDashboard();
            }
        } catch (err) { navigate('/error') }
    };

    const handleChange = (e) => {
        setEditing(true);
        const file = e.target.files[0];
        setProfile(file);
        setImagePreview(URL.createObjectURL(file));
    };
    
    const navigateBackward = () => {
        localStorage.removeItem('selectedFriend')
        navigate('/')
    }

    return (
        <div>
             {isMobile && (
                        <button onClick={navigateBackward} className="mr-4 text-gray-500 hover:text-gray-800">
                            ←
                        </button>
                    )}
            {user ? (
                <div className={`flex p-10 text-xl  w-1/3 ${theme === 'dark-theme' ? 'bg-black text-gray-300' : 'bg-white text-gray-800'}`}>
                    <div>
                        <label htmlFor="profile" className=" avatar hover:cursor-pointer"                    >
                            <div className="w-28 h-28 rounded-full">{user.imageData ? (
                                <img src={`data:image/png;base64,${user.imageData}`} alt="Fetched Image" className="max-h-28 max-w-28 rounded-full pro-img" />
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill={`${theme === 'dark-theme' ? 'white' : 'black'}`} d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-7 9c0-2.67 5.33-4 7-4s7 1.33 7 4v1H5v-1z" /></svg>
                            )}</div>
                            <h1 className="edit">Edit</h1>
                        </label>
                        <input id="profile" name="profile" type="file" className="hidden" onChange={handleChange} />
                    </div>
                    <h3 className="text-center">{user.names}</h3>
                </div>
            ) : (
                <span>
                    <span className="loading loading-dots bg-black"></span>
                </span>
            )}

            {editing && (
                <div className="fixed flex flex-col justify-center bg-black h-screen w-screen rounded-box top-0 left-0">
                    <div className="relative m-8 ml-72 w-full">
                        {imagePreview && (<img src={imagePreview} alt="Image Preview" className="max-h-96 max-w-xl rounded-box" />)}
                    </div>
                    <div className="flex space-x-10 relative justify-center">
                        <button onClick={() => setEditing(false)} className="btn text-gray-400">Cancel</button>
                        <button onClick={handleEdit} className="btn btn-success">Save</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
