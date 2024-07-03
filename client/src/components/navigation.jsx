/* eslint-disable no-unused-vars */

import { useNavigate } from "react-router-dom";
import Cookies from 'js-cookie';


const Navigation = () => {
    const logOut = () => {
        Cookies.remove('username');
        navigate('/login');
    }
    const navigate = useNavigate();


    const toChats = () => { navigate('/') }
    const toGroups = () => { navigate('/group') }
    return (
        <div className="navigating">
            <div onClick={() => toChats()}>
                <img src="/folder.png" alt="" />
                <h3>All chats</h3>
            </div>
            <div onClick={() => { toGroups() }}>
                <img src="/folder.png" alt="" />
                <h3>Groups</h3>
            </div>
            <div>
                <img src="/folder.png" alt="" />
                <h3>All chats</h3>
            </div>
            <div>
                <img src="/folder.png" alt="" />
                <h3>Setting</h3>
            </div>
            <div>
                <button onClick={() => { logOut() }}>Log out</button>

            </div>
        </div>
    )
}
export default Navigation;