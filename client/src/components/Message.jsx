/* eslint-disable react/prop-types */

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Cookies from 'js-cookie'
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

export default function Messages({ messages, info, group, onlineUsers, history, typingMembers }) {
  const friend = localStorage.getItem('selectedFriend')
  const messagesEndRef = useRef(null);
  const [scrollToBottom, setScrollToBottom] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { group_name, friend_name } = useParams()
  const navigate = useNavigate()
  const accessToken = Cookies.get('accessToken')
  const [reaction, setReaction] = useState(null)
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    messageId: null,
  });

  const handleScrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      setScrollToBottom(false);
    }
  }, [messages, history]);

  useEffect(() => handleScrollToBottom(), [scrollToBottom, handleScrollToBottom]);

  const handleContextMenu = (e, msgId) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      messageId: msgId,
    });
  };

  const handleClickOutside = () => {
    if (contextMenu.visible) {
      setContextMenu({ ...contextMenu, visible: false });
    }
  };

  const addEmoji = (emoji) => {
    setReaction((prevMessage) => prevMessage + emoji.native);
    setShowEmojiPicker(false)
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [contextMenu]);

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const isLink = (message) => {
    const match = message.match(urlRegex);
    if (match) {
      const link = match[0];
      const data = message.replace(link, `<a href="${link}" target="_blank">${link} </a>`)
      return data
    } else return message;

  };



  const getMemberPhoto = (data) => {
    let image;
    if (!data) return null
    if (group && group.members && group.members.length > 0) {
      const member = group.members.filter(member => member.email === data)[0]
      image = member.imageData
    } return image
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

  const handleDeleteMessage = async (id) => {
    if (!id) return
    const response = await fetch(`http://localhost:3001/deleteMessage/${id}`, {
      method: 'DELETE',
      headers: {
        'accessToken': accessToken,
      },
    })
    const data = await response.json()
    console.log(data)
  }

  const renderContextMenu = () => {
    if (!contextMenu.visible) return null;

    return (
      <div
        style={{
          position: "absolute",
          top: `${contextMenu.y}px`,
          left: `${contextMenu.x}px`,
          padding: "10px",
          zIndex: 1000,
        }}
      >
        <ul className="*:text-sm menu bg-base-200 rounded-box w-40">
          <li>
            <button onClick={toggleEmojiPicker}>React</button>
          </li>

          <li
            onClick={() => handleEditMessage(contextMenu.messageId)}>
            <button >Edit</button>
          </li>
          <li
            onClick={() => handleDeleteMessage(contextMenu.messageId)}
          >
            <button
              className=""
            >Delete</button>
          </li>
        </ul>
      </div>
    );
  };



  return (<div className="">
    {renderContextMenu()}

    {showEmojiPicker && (
      <div className="absolute bottom-20">
        <Picker
          data={data}
          onEmojiSelect={addEmoji}
          theme="light" />
      </div>
    )}
    {friend_name && (messages && messages.length > 0 ? (messages.map((msg) => (
      msg.sender === friend ? (
        <div key={msg._id} className={` chat chat-start rounded-lg p-2  `} >
          <div className="chat-image avatar">
            <div
              className="w-10 rounded-lg bg-gray-500 ">
              {info.imageData ? <img
                src={info.imageData}
                alt="Profile"
                className=""
              /> : <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                width="24px"
                height="24px"
                className="relative left-1 top-1 text-gray-100 "                        >
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>}
            </div>
          </div>
          {msg.type === 'text' && (
            <div
              onContextMenu={(e) => handleContextMenu(e, msg._id)}
              className="max-w-96 min-w-24 h-auto bg-gray-200  text-xs text-gray-800 chat-bubble">
              <div
                className="max-w-96 h-auto break-words text-sm font-semibold"
                dangerouslySetInnerHTML={{ __html: isLink(msg.message) }} />
              <div className="float-left flex" >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                  <circle cx="50" cy="50" r="40" stroke="#FFF" strokeWidth="5" fill="none" />
                  <circle cx="40" cy="40" r="5" fill="#FFF" />
                  <circle cx="60" cy="40" r="5" fill="#FFF" />
                  <path d="M40 60 Q50 70 60 60" stroke="#FFF" strokeWidth="5" fill="none" />
                  <circle cx="75" cy="25" r="12" fill="none" stroke="#FFF" strokeWidth="5" />
                  <line x1="75" y1="20" x2="75" y2="30" stroke="#FFF" strokeWidth="3" />
                  <line x1="70" y1="25" x2="80" y2="25" stroke="#FFF" strokeWidth="3" />
                </svg>

              </div>
              <div className="flex float-right">
                <div className="text-xs opacity-70 mt-1 text-right">
                  {msg.time}
                </div>
              </div>
            </div>
          )}{msg.type.startsWith('image') && (
            <div
              onContextMenu={(e) => handleContextMenu(e, msg._id)}
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
              onContextMenu={(e) => handleContextMenu(e, msg._id)}
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
              onContextMenu={(e) => handleContextMenu(e, msg._id)}
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
              onContextMenu={(e) => handleContextMenu(e, msg._id)}
              className="max-w-96 min-w-24  h-auto bg-indigo-500 text-white chat-bubble text-xs">
              <div className="max-w-96 h-auto break-words text-sm font-semibold" dangerouslySetInnerHTML={{ __html: isLink(msg.message) }} />
              <div className="text-xs opacity-70 mt-1 text-right">
                {msg.time}
                {msg.seen && (<div className="text-green-400 text-end text-xs font-black">✓✓</div>)}
              </div>
            </div>
          )}
          {msg.type.startsWith('image') && (
            <div
              onContextMenu={(e) => handleContextMenu(e, msg._id)}
              className="text-white w-96 p-4 ">
              <img
                src={msg.file}
                alt="attachment"
                className="rounded-lg max-w-full h-auto justify-center "
              />
              <div className="relative bottom-5 right-4 text-right text-xs ">{msg.time}</div>
            </div>)}
          {msg.type.startsWith('video') && (<div
            onContextMenu={(e) => handleContextMenu(e, msg._id)}
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
              onContextMenu={(e) => handleContextMenu(e, msg._id)}
              className="text-white w-96 p-4 rounded-lg  ">
              <audio
                controls
                src={msg.file}
              />
              <div className="text-xs opacity-70 mt-1 text-right">{msg.time}</div>
            </div>
          )}
        </div>
      )))
    ) : (
      <div className="text-center text-gray-500">No messages yet. Start the conversation!</div>
    ))}


    {group_name && (history && history.length > 0 ? (history.map((msg) => (msg.sender !== Cookies.get('user') ? (
      <div key={msg._id} className={` chat chat-start rounded-lg p-2  `} >
        <div className={`chat-image avatar  ${isOnline(msg.sender) ? 'online' : 'offline'}`}>
          <div
            onClick={() => chatNow(msg.sender)}
            className="w-10 rounded-lg bg-gray-500 ">
            {msg.sender ? <img
              src={getMemberPhoto(msg.sender)}
              alt="Profile"
              className=""
            /> : <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              width="24px"
              height="24px"
              className="relative left-1 top-1 text-gray-100 "                        >
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
            <img src={msg.image} alt="attachment" className="rounded" />
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
            </div>
          </div>
        ) : (msg.type === 'image' ? (
          <div className="bg-blue-500 text-white w-96 p-4 chat-bubble">
            <img
              src={msg.image}
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
            <img src={msg.image} alt="attachment" className="rounded max-w-80 max-h-96 justify-center " />
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
    ))}{typingMembers && typingMembers.length > 0&&group_name &&
      typingMembers.length
    }
    <div ref={messagesEndRef}></div>
  </div>
  )



}