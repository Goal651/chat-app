import { Link } from "react-router-dom"


function Header() {



    return (
        <div className="header">
            <Link>Home</Link>
            <Link>Chat</Link>
            <Link>Profile</Link>
            <Link>Home</Link>
            <button>Log out</button>
        </div>

    )


}

export default Header