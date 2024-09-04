import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import crypto from 'crypto-js'

const Test = () => {
    const navigate = useNavigate()
    useEffect(() => {
        const generateKeyPair = async () => {
            const keyPair = await window.crypto.subtle.generateKey({
                name: 'ECDH',
                namedCurve: 'P-256'
            }, true, ['derivekey', 'deriveBits']);
            const publicKey = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey)
            const privateKey = keyPair.privateKey;
            console.log('hello')
        }
        generateKeyPair()
    }, [navigate])
    return (
        <div>we are Testing </div>
    )
}

export default Test