
function Feedback(data) {


    return (
        <div>

            {data < 0 ? (
                <div>
                    <h1>{data.data.type}</h1>
                    <h2>{data.data.message}</h2>
                </div>
            ) : (
                <div>
                    <h1>No Friend selected</h1>
                    <h2>Please select a friend</h2>
                </div>
            )}
        </div>
    );
}

export default Feedback