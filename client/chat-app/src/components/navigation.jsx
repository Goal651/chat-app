/* eslint-disable no-unused-vars */

import { useNavigate } from "react-router-dom";
import Cookies from 'js-cookie';


const Navigation = () => {
    const navigate = useNavigate();
    return (
        <div className="navigating">
            <div>
                <img src="/folder.png" alt="" />
                <h3>All chats</h3>
            </div>
            <div>
                <img src="/folder.png" alt="" />
                <h3>All chats</h3>
            </div>
            <div>
                <img src="/folder.png" alt="" />
                <h3>All chats</h3>
            </div>
            <div>
                <img src="/folder.png" alt="" />
                <h3>All chats</h3>
            </div>
            
        </div>
    )
}
export default Navigation;