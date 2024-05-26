import { Link, useNavigate } from "react-router-dom"


function Header() {
    const navigate = useNavigate();
    const logOut = () => {
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