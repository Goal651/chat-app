/* eslint-disable react-hooks/exhaustive-deps */

const ChannelArea = () => {
    
    
    
    return (
        <div id="chatArea">
            <div className="chatArea_container">
                <div></div>
                <div className="chatArea_header">
                    <h1>Chat App</h1>
                </div>
                <div className="chatArea_body">
                    <div className="chatArea_history">
                        
                    </div>
                </div>
                <div className="chatArea_footer">
                    <input type="text" placeholder="Enter message" value={""} />
                    <button onClick={""}>Send</button>
                </div>
            </div>
        </div >
    );
};

export default ChannelArea;
