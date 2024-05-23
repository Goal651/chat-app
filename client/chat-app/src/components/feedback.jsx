
function Feedback(data) {
    

    return (
        <div>
            
            <h1>{data.data.type}</h1>
            <h2>{data.data.message}</h2>
        </div>
    );
}

export default Feedback