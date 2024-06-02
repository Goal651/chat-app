import { useNavigate } from "react-router-dom";
function NotFound() {
    const navigate = useNavigate()

    return (
        <div className="construction">
            <h1>Oops !</h1>
            <h2>Page not found</h2>
            <button onClick={() => {
                navigate('/')
            }}>Return Home</button>


        </div>
    )


}

export default NotFound;