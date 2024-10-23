import { useState } from 'react';

export default function Testing() {
    const [test, setTest] = useState(false);

    return (
        <div className="flex flex-col items-center p-4">

            <button 
            onClick={() => setTest(!test)}
            className="btn btn-primary"
            >TESTING</button>
        </div>
    );
}
