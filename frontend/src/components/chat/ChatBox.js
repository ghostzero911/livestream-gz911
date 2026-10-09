import React, { useState, useEffect, useRef } from 'react';
//import io from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import './ChatBox.css';

// Helper function to create guest user
// const getGuestUser = () => {
//     let user = localStorage.getItem('guestUser');
//     if (user) {
//         return JSON.parse(user);
//     } else {
//         // Generate a new guest user if none exists
//         const newUser = {
//             userId: `guest_${Math.random().toString(36).substring(2, 9)}`,
//             username: `Guest_${Math.random().toString(36).substring(2, 6)}`
//         };
//         localStorage.setItem('guestUser', JSON.stringify(newUser));
//         return newUser;
//     }
// };

const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch (e) {
        return '';
    }
};

function ChatBox({ room, socket, viewCount }) { // 'room' will be the ID
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState(''); // store the message sent    
    const messagesEndRef = useRef(null); // Ref to auto-scroll
    //const [viewCount, setViewCount] = useState(0); // store the number of people connected
    const [isKicked, setIsKicked] = useState(false);    // check if status kicked/banned of user
    const [kickMessage, setKickMessage] = useState(''); // send notice of kick status
    const [openMenuId, setOpenMenuId] = useState(null); // store ID of the message that has menu currently opened
    //const socketRef = useRef(null);
    //const currentUser = getGuestUser();
    const { isLoggedIn, user } = useAuth();

    useEffect(() => {
        if (!socket) return;

        const messageListener = (data) => {
            setMessages((prevMessages) => [...prevMessages, data]);
        };

        const deleteListener = (messageId) => {
            setMessages((prevMessages) =>
                prevMessages.filter((msg) => msg.id !== messageId)
            );
        };

        const kickListener = (data) => {
            setIsKicked(true);
            setKickMessage(data.message);

            // Auto-rejoin logic:
            // Set a timer. When it finishes, reset the kick status.
            // The socket will be disconnected, so the user needs to refresh,
            // but this will at least re-enable the UI.
            setTimeout(() => {
                setIsKicked(false);
                setKickMessage('');
                // We can't force a reconnect, but we can re-enable the UI
                // to encourage a refresh or just wait for the user to do it.
                // A simple way to re-enable is just resetting the state.
            }, data.duration * 1000 + 1000); // Add 1 sec buffer
        };

        const errorListener = (err) => {
            if (err.message.includes('kicked')) {
                setIsKicked(true);
                setKickMessage(err.message);
            }
        };

        // const socket = io(process.env.REACT_APP_API_CHAT_URL, {
        //     auth: {
        //         token: token // Send the user's auth token
        //     }
        // });

        //socketRef.current = socket;
        // socket.emit('join_room', room);

        // socket.on('viewer_count_update', (count) => {
        //     setViewCount(count);
        // });

        socket.on('you_are_kicked', (message) => {
            alert(message);
        });

        socket.on('receive_message', messageListener);
        socket.on('message_deleted', deleteListener);
        socket.on('you_are_kicked', kickListener);
        socket.on('connect_error', errorListener);

        return () => {
            socket.off('receive_message', messageListener);
            socket.off('message_deleted', deleteListener);
            socket.off('you_are_kicked', kickListener);
            socket.off('connect_error', errorListener);
            // socket.disconnect();
            // socketRef.current = null;
            // socket.emit('leave_room', room);
        };
    }, [socket]);

    // Effect auto-scroll to the bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!isLoggedIn || !user || newMessage.trim() === '' || !socket) return;

        const messageData = {
            id: crypto.randomUUID(),
            room: room,
            // userId: user.id,
            // username: user.name,
            message: newMessage,
            timestamp: new Date().toISOString()
        };

        socket.emit('send_message', messageData);
        //setMessages((prevMessages) => [...prevMessages, messageData]);
        setNewMessage('');
    };

    const handleDeleteMessage = (messageId) => {
        if (!isLoggedIn || !user?.is_admin || !socket) {
            console.log('Delete aborted');
            return;
        }
        socket.emit('delete_message', { id: messageId, room: room });
        setOpenMenuId(null);
    };

    const handleKickUser = (userId) => {
        if (!window.confirm(`Kick this user for 1 minutes?`)) return;
        if (socket) {
            socket.emit('kick_user', {
                userIdToKick: userId,
                durationSeconds: 60
            });
        }
        setOpenMenuId(null);
    };

    const handleMessageClick = (msg) => {
        if (isLoggedIn && user?.is_admin) {
            setOpenMenuId(msg.id === openMenuId ? null : msg.id);
        }
    };

    const handleKeyDown = (e) => {
        // If Shift + Enter is pressed, do nothing and let the default (adding a new line) happen.
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(e);
        }
    };

    return (
        <div className="chat-box">
            <div className="chat-header">
                <h4>TV Bolaku Chatroom (<span className="chat-view-count">{viewCount}</span>)</h4>
            </div>
            <div className="chat-messages">
                {messages.map((msg) => (                    
                    <div key={msg.id || msg.timestamp} className={`chat-message ${isLoggedIn && msg.userId === user.id ? 'sent' : 'received'} ${isLoggedIn && !!user?.is_admin ? 'admin-view' : ''}`} onClick={() => handleMessageClick(msg)}>
                        <span className="message-meta">
                            <span className="message-timestamp">{formatTime(msg.timestamp)}</span>
                            {(!user || msg.userId !== user.id) && (
                                <span className="message-username"> - 
                                    {!!msg.is_admin && <span className="admin-badge">ADMIN</span>}
                                    {msg.username || 'User'}:
                                </span>
                            )}
                        </span>
                        <span className="message-text">{msg.message}</span>
                        {/* {isLoggedIn && user.is_admin && (
                            <button className="delete-message-btn" onClick={() => handleDeleteMessage(msg.id)}>delete</button>
                        )} */}
                        {isLoggedIn && !!user?.is_admin && openMenuId === msg.id && (
                            <div className="chat-menu">
                                <button onClick={() => handleDeleteMessage(msg.id)}>Hapus pesan</button>
                                {user.id !== msg.userId && (
                                    <button onClick={() => handleKickUser(msg.userId)}>Blok user selama 1 menit</button>
                                )}
                            </div>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            {isLoggedIn ? (
                isKicked ? (
                    <div className="chat-kick-prompt">
                        {kickMessage}
                    </div>
                ) : (
                    <form className="chat-input-form" onSubmit={sendMessage}>
                        <textarea
                            className="chat-textarea"
                            placeholder="Ketik pesan... (Shift+Enter untuk baris baru)"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <button type="button" onClick={sendMessage}>Kirim</button>
                    </form>
                )
            ) : (
                <div className="chat-login-prompt">
                    Silahkan <Link to="/login">MASUK</Link> untuk menggunakan livechat.
                </div>
            )}
        </div>
    );
}

export default ChatBox;