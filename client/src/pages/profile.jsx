import { useEffect, useState } from "react"

import Cookies from "js-cookie"
import { useNavigate } from "react-router-dom"

const Profile = () => {
    const navigate = useNavigate()
    const [detail, setDetail] = useState({})
    const username = Cookies.get('username');
    const [imageBase64, setImageBase64] = useState('')


    const arrayBufferToBase64 = (buffer) => {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    useEffect(() => {
        if (!username) navigate('/login');
    }, [navigate, username]);

    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                const response = await fetch(`http://localhost:3001/getUser/${username}`)
                const data = await response.json()
                setDetail(data.user)

            } catch (error) {
                console.error("Error fetching friends:", error)
            } 
        }
        fetchUserDetails()
    }, [username])

    
    useEffect(() => {
        const groups = () => {
            if (!detail) return
            if (!detail.imageData) return
            const result = arrayBufferToBase64(detail.imageData.data);
            setImageBase64(result)
        }
        groups()
    }, [detail])

    return (
        <div>
            {detail ? (
                <div className="flex flex-col p-10 text-xl text-black" >
                    <div>
                        {
                            imageBase64 ?
                                <img src={`data:image/jpeg;base64,${imageBase64}`} alt="Fetched Image" className="h-28 w-28 rounded-full" />
                                : <img src="/nopro.png" alt="No Profile" className="h-14" />
                        }
                    </div>
                    <h3 className="text-center">{detail.username}</h3>
                </div>) : (<span></span>)}
        </div>
    )

}
export default Profile