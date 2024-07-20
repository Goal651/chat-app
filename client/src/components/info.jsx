/* eslint-disable no-unused-vars */
/* eslint-disable no-empty-pattern */
import { useNavigate, useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import Cookies from "js-cookie"


const Details = () => {
    const { user, name } = useParams()
    const navigate = useNavigate()
    const [details, setDetails] = useState({})
    const [groupInfo, setGroupInfo] = useState([])
    const [userInfo, setUserInfo] = useState([])
    const [imageBase64, setImageBase64] = useState('')
    const [main, setMain] = useState([])
    const username = Cookies.get('username')

    const arrayBufferToBase64 = (buffer) => {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };



    useEffect(() => {
        if (!user) return
        const fetchUserDetails = async () => {
            const response = await fetch(`http://localhost:3001/getUser/${user}`);
            const data = await response.json();
            setUserInfo(data.user);
        }

        fetchUserDetails()
    }, [user])
    useEffect(() => {
        if (!username) return
        const fetchUserDetails = async () => {
            const response = await fetch(`http://localhost:3001/getUser/${username}`);
            const data = await response.json();
            setUserInfo(data.user);
        }
        fetchUserDetails()
    }, [username])

    useEffect(() => {
        const users = () => {
            if (!user) return
            if (!userInfo.imageData) return
            const result = arrayBufferToBase64(userInfo.imageData.data);
            setImageBase64(result)
        }
        users()
    }, [userInfo, user])

    useEffect(() => {
        const groups = () => {
            if (!name) return
            if (!groupInfo.imageData) return
            const result = arrayBufferToBase64(groupInfo.imageData.data);
            setImageBase64(result)
        }
        groups()
    }, [groupInfo, name])

    useEffect(() => {
        const fetchGroupDetails = async () => {
            if (!name) return
            const response = await fetch(`http://localhost:3001/getGroup/${name}`);
            const data = await response.json();
            setGroupInfo(data.group)
        }
        fetchGroupDetails()
    }, [name])


    return (
        <div className="flex flex-col p-10 text-xl text-black">
            {user || name ? (
                user ? (
                    <div className="flex flex-col p-10 text-xl text-black" >
                        <div>
                            {
                                imageBase64 ?
                                    <img src={`data:image/jpeg;base64,${imageBase64}`} alt="Fetched Image" className="h-28 w-28 rounded-full" />
                                    : <img src="/nopro.png" alt="No Profile" className="h-14" />
                            }
                        </div>
                        <h3 className="text-center">{userInfo.username}</h3>

                    </div>
                ) : (
                    <div className="flex flex-col p-10 text-xl text-black">
                        <div>
                            {
                                imageBase64 ? (<div>
                                    <img src={`data:image/jpeg;base64,${imageBase64}`} alt="Fetched Image" className="h-28 w-28 rounded-full" />
                                    <video src={`data:image/jpeg;base64,${imageBase64}`} />
                                </div>
                                ) : <img src="/nopro.png" alt="No Profile" className="h-14" />
                            }
                        </div>
                        <h3 className="text-center">{groupInfo.name}</h3>
                        <h5>Admin: {groupInfo.admin}</h5>

                    </div>
                )
            ) : (
                <div className="flex flex-col p-10 text-xl text-black" >
                    <div>
                        {imageBase64 ?
                            <img src={`data:image/jpeg;base64,${imageBase64}`} alt="Fetched Image" className="h-28 w-28 rounded-full" />
                            : <img src="/nopro.png" alt="No Profile" className="h-14" />
                        }
                    </div>
                    <h3 className="text-center">{userInfo.username}</h3>

                </div>)}
        </div >
    )

}
export default Details