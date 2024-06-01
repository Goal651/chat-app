import { Link, useNavigate } from "react-router-dom"
import Cookies from 'js-cookie';


function Header() {
    const navigate = useNavigate();
    const logOut = () => {
        Cookies.remove('username');
        navigate('/login');
    }

    return (
        <div className="header">
            <Link to={'/home'}>Home</Link>
            <Link to={'/chat'}>Chat</Link>
            <Link to={'/profile'}>Profile</Link>
            <Link to={'/setting'}>Setting</Link>
            <button onClick={() => { logOut() }}>Log out</button>
        </div>

    )


}

export default Header