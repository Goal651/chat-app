/* eslint-disable react/prop-types */

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Cookies from 'js-cookie'

export default function Messages({ messages, info, group, onlineUsers, history }) {

  const apiKey = '3b3f4d51fc1a85aeab5c0e15b90913fa'
  const friend = localStorage.getItem('selectedFriend')
  const messagesEndRef = useRef(null);
  const [scrollToBottom, setScrollToBottom] = useState(false);
  const { name, user } = useParams()
  const navigate = useNavigate()

  const handleScrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      setScrollToBottom(false);
    }
  }, [messages, history]);

  useEffect(() => handleScrollToBottom(), [scrollToBottom, handleScrollToBottom]);


  const handleAuxClick = (e) => {
    e.preventDefault()
    alert('hello')
  }

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const fetchMetadata = async (url) => {
    try {
      const response = await fetch(`https://api.linkpreview.net?key=${apiKey}&q=${url}`);
      const data = await response.json();
      console.log(data)
      return {
        title: data.title || 'No Title',
        description: data.description || 'No Description',
        image: data.image || '',
      };
    } catch (error) {
      console.error('Error fetching metadata:', error);
      return url;
    }
  };

  // Function to process the message and convert links into previews
  const isLink = async (message) => {
    const match = message.match(urlRegex);
    if (match) {
      const link = match[0];
      const metadata = await fetchMetadata(link);
      if (metadata) {
        return `
                <div class="link-preview">
                    <a class="link link-hover font-semibold" href="${link}" target="_blank" rel="noopener noreferrer">
                        ${metadata.title}
                    </a>
                    <p>${metadata.description}</p>
                    ${metadata.image ? `<img src="${metadata.image}" alt="${metadata.title}" />` : ''}
                </div>
            `;
      } else {
        return message;
      }
    } else {
      return message;
    }
  };

  const getMemberPhoto = (data) => {
    let image;
    if (!data) return null
    if (group && group.members && group.members.length > 0) {
      const member = group.members.filter(member => member.email === data)[0]
      image = member.imageData
    }
    return image
  }

  const getMemberName = (data) => {
    let name;
    if (!data) return ""
    if (group && group.members) {
      const member = group.members.filter(member => member.email === data)[0]
      name = member.username
    } return name
  }

  const isOnline = (data) => {
    if (!onlineUsers) return false
    return onlineUsers.includes(data)
  }

  const chatNow = useCallback((friend) => {
    navigate(`/chat/${friend}`)
    localStorage.setItem('selectedFriend', `${friend}`)
  }, [navigate])




  return (<div className="">
    {user && (messages && messages.length > 0 ? (messages.map(async(msg) => (
      msg.sender === friend ? (
        <div key={msg._id} className={` chat chat-start rounded-lg p-2  `} >
          <div className="chat-image avatar">
            <div
              className="w-10 rounded-lg bg-gray-500 ">
              {info.imageData ? <img
                src={`data:image/jpeg;base64,${info.imageData}`}
                alt="Profile"
                className=""
              /> : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24px" height="24px" className="relative left-1 top-1 text-gray-100 "                        >
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>}
            </div>
          </div>
          {msg.type === 'text' && (
            <div
              onAuxClick={handleAuxClick}
              className="max-w-96 min-w-24 h-auto bg-gray-200  text-xs text-gray-800 chat-bubble">
              <div className="max-w-96 h-auto break-words text-sm font-semibold" dangerouslySetInnerHTML={{ __html: `${await isLink(msg.message)}` }} />
              <div className="flex float-right">
                <div className="text-xs opacity-70 mt-1 text-right">
                  {msg.time}
                </div>
              </div>
            </div>
          )}{msg.type.startsWith('image') && (
            <div
              onAuxClick={handleAuxClick}
              className=" text-white w-96 p-4 rounded-xl">
              <img
                src={msg.file}
                alt="attachment"
                className="rounded-lg max-w-80 max-h-96 justify-center "
              />
              <div className="relative right-12 bottom-6 text-xs  text-right">{msg.time}</div>
            </div>)}
          {msg.type.startsWith('video') && (
            <div
              onAuxClick={handleAuxClick}
              className="bg-gray-500 text-white w-96 p-4 chat-bubble">
              <video
                src={msg.file}
                alt="attachment"
                className="rounded max-w-80 max-h-96 justify-center"
                autoPlay={false}
                controls={true}
              />
              <div className="text-xs opacity-70 mt-1 text-right">{msg.time}</div>
            </div>
          )}
          {msg.type.startsWith('audio') && (
            <div
              onAuxClick={handleAuxClick}
              className=" text-white w-96 p-4  bg-gray-200">
              <audio
                src={msg.file}
                className="rounded max-w-80 max-h-96 justify-center "
                autoPlay={false}
                controls={true}
              />
              <div className="text-xs opacity-70 mt-1 text-right">{msg.time}</div>
            </div>
          )}
        </div>
      ) : (
        <div key={msg._id} className={`chat chat-end rounded-lg p-2  `} >
          {msg.type === 'text' && (
            <div
              onAuxClick={handleAuxClick}
              className="max-w-96 min-w-24  h-auto bg-indigo-500 text-white chat-bubble text-xs">
              <div className="max-w-96 h-auto break-words text-sm font-semibold" dangerouslySetInnerHTML={{ __html:`${await isLink(msg.message)}` }} />
              <div className="text-xs opacity-70 mt-1 text-right">
                {msg.time}
                {msg.seen && (<div className="text-green-400 text-end text-xs font-black">✓✓</div>)}
              </div>
            </div>
          )}
          {msg.type.startsWith('image') && (
            <div
              onAuxClick={handleAuxClick}
              className="text-white w-96 p-4 ">
              <img
                src={msg.file}
                alt="attachment"
                className="rounded-lg max-w-full h-auto justify-center "
              />
              <div className="relative bottom-5 right-4 text-right text-xs ">{msg.time}</div>
            </div>)}
          {msg.type.startsWith('video') && (<div
            onAuxClick={handleAuxClick}
            className=" text-white w-96 p-4 rounded-lg bg-black">
            <video
              src={msg.file}
              alt="attachment"
              className="rounded-lg w-full h-72 justify-center"
              autoPlay={false}
              controls={true}
            />
            <div className="text-xs opacity-70 mt-1 text-right">{msg.time}</div>
          </div>
          )}
          {msg.type.startsWith('audio') && (
            <div
              onAuxClick={handleAuxClick}
              className="text-white w-96 p-4 rounded-lg  ">
              <audio
                controls
                src={msg.file}
              />
              <div className="text-xs opacity-70 mt-1 text-right">{msg.time}</div>
            </div>
          )}

        </div>
      )
    ))
    ) : (
      <div className="text-center text-gray-500">No messages yet. Start the conversation!</div>
    ))}


    {name && (history && history.length > 0 ? (history.map((msg) => (msg.sender !== Cookies.get('user') ? (
      <div key={msg._id} className={` chat chat-start rounded-lg p-2  `} >
        <div className={`chat-image avatar  ${isOnline(msg.sender) ? 'online' : 'offline'}`}>
          <div
            onClick={() => chatNow(msg.sender)}
            className="w-10 rounded-lg bg-gray-500 ">
            {msg.sender ? <img
              src={`data:image/jpeg;base64,${getMemberPhoto(msg.sender)}`}
              alt="Profile"
              className=""
            /> : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24px" height="24px" className="relative left-1 top-1 text-gray-100 "                        >
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>}
          </div>
        </div>
        {msg.type === 'text' ? (
          <div className="max-w-96 min-w-24 h-auto bg-white text-gray-800 chat-bubble">
            <div className="font-semibold text-sm text-indigo-900 mb-1 link-hover hover:cursor-pointer">{getMemberName(msg.sender)}</div>
            <div className="max-w-96 h-auto  text-sm break-words" dangerouslySetInnerHTML={{ __html: isLink(msg.message) }} />
            <div className="mt-1 flex justify-between">
              <div className=" font-semibold grow pr-4 flex">
                <svg
                  width="20"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="light-gray"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 5C7 5 3.2 9 2 12c1.2 3 5 7 10 7s8.8-4 10-7c-1.2-3-5-7-10-7zm0 11c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4zm0-6.5c-1.4 0-2.5 1.1-2.5 2.5s1.1 2.5 2.5 2.5 2.5-1.1 2.5-2.5-1.1-2.5-2.5-2.5z"
                    fill="lightgray"
                  />
                </svg>
                <div className="text-gray-300 text-center text-xs font-semibold"> {msg.seen.length}</div></div>
              <div className="text-xs opacity-70 text-right">
                {msg.time}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white text-gray-800 w-96 p-4 chat-bubble ">
            <img src={`data:image/jpeg;base64,${msg.image}`} alt="attachment" className="rounded" />
            <div className="mt-1 flex justify-between">
              <div className="text-sm font-semibold flex grow pr-4">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 5C7 5 3.2 9 2 12c1.2 3 5 7 10 7s8.8-4 10-7c-1.2-3-5-7-10-7zm0 11c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4zm0-6.5c-1.4 0-2.5 1.1-2.5 2.5s1.1 2.5 2.5 2.5 2.5-1.1 2.5-2.5-1.1-2.5-2.5-2.5z"
                    fill="white"
                  />
                </svg>
                <div>{msg.seen.length}</div>
              </div>
              <div className="text-xs opacity-70 text-right">
                {msg.time}
              </div>
            </div>
          </div>
        )}
      </div>
    ) : (
      <div key={msg._id} className={`chat  chat-end rounded-lg p-2  `} >
        {msg.type === 'text' ? (
          <div className="max-w-96 h-auto bg-indigo-700 text-white chat-bubble"                                >
            <div className="max-w-80  h-auto text-xs break-words" dangerouslySetInnerHTML={{ __html: isLink(msg.message) }} />
            <div className="mt-1 flex  justify-between">
              <div className="text-sm flex opacity-75 font-semibold grow pr-4"> <svg
                width="20"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 5C7 5 3.2 9 2 12c1.2 3 5 7 10 7s8.8-4 10-7c-1.2-3-5-7-10-7zm0 11c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4zm0-6.5c-1.4 0-2.5 1.1-2.5 2.5s1.1 2.5 2.5 2.5 2.5-1.1 2.5-2.5-1.1-2.5-2.5-2.5z"
                  fill="white"
                />
              </svg>
                <div className="text-gray-300 text-center text-xs font-semibold"> {msg.seen.length}</div>
              </div>
              <div className="text-xs opacity-70 text-right">
                {msg.time}
              </div>
            </div>                            </div>
        ) : (msg.type === 'image' ? (
          <div className="bg-blue-500 text-white w-96 p-4 chat-bubble">
            <img
              src={`data:image/jpeg;base64,${msg.image}`}
              alt="attachment"
              className="rounded max-w-80 max-h-96 justify-center "
            />
            <div className="mt-1 flex justify-between">
              <div className="text-sm font-semibold grow pr-4 flex">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 5C7 5 3.2 9 2 12c1.2 3 5 7 10 7s8.8-4 10-7c-1.2-3-5-7-10-7zm0 11c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4zm0-6.5c-1.4 0-2.5 1.1-2.5 2.5s1.1 2.5 2.5 2.5 2.5-1.1 2.5-2.5-1.1-2.5-2.5-2.5z"
                    fill="white"
                  />
                </svg>
                <div>
                  {msg.seen.length}
                </div>
              </div>
              <div className="text-xs opacity-70 text-right">
                {msg.time}
              </div>
            </div>
          </div>) : (
          <div className="bg-blue-500 text-white w-96 p-4 chat-bubble">
            <img src={`data:image/jpeg;base64,${msg.image}`} alt="attachment" className="rounded max-w-80 max-h-96 justify-center " />
            <div className="mt-1 flex justify-between">
              <div className="text-sm font-semibold grow pr-4 flex">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 5C7 5 3.2 9 2 12c1.2 3 5 7 10 7s8.8-4 10-7c-1.2-3-5-7-10-7zm0 11c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4zm0-6.5c-1.4 0-2.5 1.1-2.5 2.5s1.1 2.5 2.5 2.5 2.5-1.1 2.5-2.5-1.1-2.5-2.5-2.5z"
                    fill="white"
                  />
                </svg>
                <div>
                  {msg.seen.length}
                </div>
              </div>
              <div className="text-xs opacity-70 text-right">
                {msg.time}
              </div>
            </div>
          </div>
        )
        )}
        <div></div>
      </div>
    )
    ))
    ) : (
      <div className="text-center text-gray-500">No messages yet. Start the conversation!</div>
    ))}
    <div ref={messagesEndRef}></div>
  </div>
  )



}