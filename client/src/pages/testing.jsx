/* eslint-disable no-unused-vars */
import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Test  ()  {
    const navigate = useNavigate()
    return (
        <div>
            <div>We are Testing so go home </div>
            <Link to={'/'}>Home</Link>
        </div>
    )
}
