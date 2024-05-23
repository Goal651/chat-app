/* eslint-disable react/prop-types */

function MessageContainer({ message }) {
    console.log(message)
    return (
        <div>
            <div className="chatArea_message">

                <div key={message._id}>
                    <h3>{message.sender}</h3>
                    <div>{message.message}</div>
                </div>

            </div>
        </div>
    );
}

export default MessageContainer;
