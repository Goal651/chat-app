/* eslint-disable react/prop-types */
import { useEffect, useState } from "react"

import Cookies from "js-cookie"
import { useNavigate } from "react-router-dom"


const arrayBufferToBase64 = (buffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}


const Profile = ({dataFromProfile}) => {
    const navigate = useNavigate()
    const [detail, setDetail] = useState({})
    const username = Cookies.get('username');
    const [imageBase64, setImageBase64] = useState('')
    const [profile, setProfile] = useState(null)
    const [imagePreview, setImagePreview] = useState('')
    const [editing, setEditing] = useState(false)
    const [reload, setReload] = useState(false)

    useEffect(() => {
        if (!username) navigate('/login');
    }, [navigate, username]);

    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                const response = await fetch(`http://localhost:3001/getUser/${username}`)
                const data = await response.json()
                setDetail(data.user)
                setReload(false)
            } catch (error) {
                console.error("Error fetching friends:", error)
            }
        }
        fetchUserDetails()
    }, [username,reload])

    useEffect(() => {
        const groups = () => {
            if (!detail) return
            if (!detail.imageData) return
            const result = arrayBufferToBase64(detail.imageData.data);
            setImageBase64(result)
        }
        groups()
    }, [detail])

    const sendDataToDashboard=()=>{dataFromProfile(true)}

    const handleEdit = async (email) => {
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('image', profile);
            formDataToSend.append('email', email)
            const response = await fetch("http://localhost:3001/editUser/profile", {
                method: "PUT",
                body: formDataToSend
            })
            if (!response.status === 200) return console.error('error saving the profile')
            setEditing(false)
            setReload(true)
            sendDataToDashboard()
        } catch (error) {
            console.error("Error submitting data:", error);
        }
    }

    const handleChange = (e) => {
        setEditing(true)
        const { files } = e.target;
        const file = files[0];
        setProfile(file);
        setImagePreview(URL.createObjectURL(file));
    }


    return (
        <div>
            {detail ? (
                <div className="flex flex-col p-10 text-xl text-black" >
                    <label htmlFor="profile" className="profile rounded-full hover:cursor-pointer ">{imageBase64 ?
                        <img src={`data:image/jpeg;base64,${imageBase64}`} alt="Fetched Image" className="h-28 w-28 rounded-full pro-img" />
                        : <img src="/nopro.png" alt="No Profile" className="h-14 pro-img" />
                    }<h1 className="edit text-white" >Edit</h1>
                    </label>
                    <input id="profile" name="profile" type="file" className="hidden" onChange={handleChange} />
                    <h3 className="text-center">{detail.username}</h3>
                </div>) : (<span>
                    <span className="loading loading-dots bg-black "></span>
                </span>)}
            {editing && (<div className="fixed flex flex-col justify-center bg-black h-screen w-screen rounded-box top-0 left-0">
                <div className="relative m-8 ml-72 w-full "> {imagePreview && <img src={imagePreview} alt="Image Preview" className="max-h-96 max-w-xl rounded-box " />}</div>
                <div className="flex space-x-10 relative  justify-center">
                    <button onClick={() => { setEditing(false) }} className="btn text-gray-400">cancel</button>
                    <button onClick={() => handleEdit(detail.email)} className="btn btn-success">Save</button>
                </div>
            </div>)}
        </div>
    )

}
export default Profile