import { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import { socket } from "../socket";
import MobileContainer from "../components/MobileContainer";
import "./Inbox.css";
import { useLocation, useNavigate } from "react-router-dom";
import { BsPinAngleFill, BsSearch } from "react-icons/bs";

export default function Inbox() {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const chatEndRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const API_URL = process.env.REACT_APP_API_URL;
  const query = new URLSearchParams(location.search);
  const targetUserId = query.get("contact") || query.get("to");
  const fallbackPic = "/default-profile.png";

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  const fetchConversations = useCallback(async () => {
    const res = await axios.get(`${API_URL}/messages/conversations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setConversations(res.data);
  }, [token, API_URL]);

  const fetchMessagesWith = useCallback(async (otherUserId) => {
    const res = await axios.get(`${API_URL}/messages/with/${otherUserId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setChat(res.data);

    await axios.patch(`${API_URL}/messages/seen/${otherUserId}`, null, {
      headers: { Authorization: `Bearer ${token}` },
    });

    await fetchConversations();
    scrollToBottom();
  }, [token, fetchConversations, API_URL]);

  const handleUserClick = useCallback(async (user) => {
    setSelectedUser(user);
    navigate(`/inbox?contact=${user.otherUserId}`, { replace: true });
    await fetchMessagesWith(user.otherUserId);
  }, [navigate, fetchMessagesWith]);

  const sendMessage = async () => {
    if (!message.trim() || !selectedUser) return;

    const res = await axios.post(
      `${API_URL}/messages/send`,
      { receiver: selectedUser.otherUserId, message },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    socket.emit("sendMessage", res.data.newMessage);
    setMessage("");
    setChat((prev) => [...prev, res.data.newMessage]);
    scrollToBottom();
  };

  useEffect(() => {
    const init = async () => {
      if (initialized) return;
      setInitialized(true);

      await fetchConversations();

      const profileRes = await axios.get(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const myId = profileRes.data._id;
      setCurrentUserId(myId);
      socket.connect();
      socket.emit("join", myId);

      if (targetUserId) {
        const match = conversations.find((c) => c.otherUserId === targetUserId);
        if (match) {
          await handleUserClick(match);
        } else {
          const res = await axios.get(`${API_URL}/profile/public/${targetUserId}`);
          await handleUserClick({
            otherUserId: res.data._id,
            firstName: res.data.firstName,
            lastName: res.data.lastName,
            profilePic: res.data.profilePic,
          });
        }
      }
    };

    init();

    socket.on("newMessage", async (msg) => {
      const isCurrentChat =
        selectedUser &&
        (
          msg.sender === selectedUser.otherUserId ||
          msg.receiver === selectedUser.otherUserId ||
          msg.sender?._id === selectedUser.otherUserId ||
          msg.receiver?._id === selectedUser.otherUserId
        );

      if (isCurrentChat) {
        setChat((prev) => {
          const exists = prev.some((m) => m._id === msg._id);
          if (!exists) return [...prev, msg];
          return [...prev]; // force re-render
        });
        scrollToBottom();
      }

      await fetchConversations();
    });

    return () => {
      socket.off("newMessage");
      socket.disconnect();
    };
  }, [targetUserId, selectedUser, conversations, handleUserClick, fetchConversations, token, initialized]);

  const deleteConversation = async (userId) => {
    await axios.delete(`${API_URL}/messages/with/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setSelectedUser(null);
    setChat([]);
    setMessage("");
    navigate("/inbox", { replace: true });
    await fetchConversations();
    setDropdownOpen(null);
  };

  const pinConversation = async (userId) => {
    await axios.patch(`${API_URL}/messages/pin/${userId}`, null, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await fetchConversations();
    setDropdownOpen(null);
  };

  const lastSent = [...chat].reverse().find((msg) => msg.sender._id === currentUserId);
  const isSeen = lastSent?.seenBy?.includes(selectedUser?.otherUserId);

  const filteredConversations = conversations.filter((user) =>
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinned = filteredConversations.filter((u) => u.isPinned);
  const others = filteredConversations.filter((u) => !u.isPinned);

  const groupMessagesByDate = () => {
    const grouped = {};
    chat.forEach((msg) => {
      const dateKey = new Date(msg.timestamp).toDateString();
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(msg);
    });
    return grouped;
  };

  const getDateLabel = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString();
  };

  const renderConversationItem = (user) => (
    <div key={user.otherUserId} className="conversation-item">
      <div className="conversation-left" onClick={() => handleUserClick(user)}>
        <img
          src={user.profilePic || fallbackPic}
          className="conversation-avatar"
          onError={(e) => (e.target.src = fallbackPic)}
          alt="user"
        />
        <div className="conversation-details">
          <div className="conversation-name">
            {user.firstName} {user.lastName}
            {user.isPinned && <BsPinAngleFill className="pin-icon" />}
          </div>
          <div className="conversation-preview">{user.lastMessage}</div>
        </div>
      </div>
      <div className="conversation-time">
        <div>{new Date(user.lastMessageTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
        {user.unreadCount > 0 && (
          <div className="unread-badge">
            {user.unreadCount > 99 ? "99+" : user.unreadCount}
          </div>
        )}
      </div>
      <div className="dots-wrapper">
        <button onClick={() => setDropdownOpen(dropdownOpen === user.otherUserId ? null : user.otherUserId)}>⋮</button>
        {dropdownOpen === user.otherUserId && (
          <div className="dropdown-menu">
            <div onClick={() => pinConversation(user.otherUserId)}>
              {user.isPinned ? "Unpin" : "Pin"}
            </div>
            <div onClick={() => deleteConversation(user.otherUserId)}>Delete</div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <MobileContainer>
      <div className="inbox-container">
        <div className="top-bar">
          <button
            className="inbox-back"
            onClick={() => {
              if (selectedUser) {
                setSelectedUser(null);
                setChat([]);
                setMessage("");
                navigate("/inbox", { replace: true });
              } else {
                navigate("/home");
              }
            }}
          >
            ←
          </button>
          {!selectedUser && (
            <button className="search-button" onClick={() => setShowSearch((prev) => !prev)}>
              <BsSearch />
            </button>
          )}
        </div>

        {showSearch && !selectedUser && (
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-bar"
          />
        )}

        {!selectedUser ? (
          <div className="conversation-list">
            <h3>Messages</h3>
            {pinned.length > 0 && (
              <div>
                <h4 style={{ marginTop: "20px", marginBottom: "8px" }}>Pinned</h4>
                {pinned.map(renderConversationItem)}
              </div>
            )}
            <h4>Recent</h4>
            {others.length > 0 ? (
              others.map(renderConversationItem)
            ) : (
              <div style={{ textAlign: "center", marginTop: "20px", color: "var(--nav-icons)" }}>
                No conversations found.
              </div>
            )}
          </div>
        ) : (
          <div className="chat-window">
            <div className="chat-header">
              <img
                src={selectedUser.profilePic || fallbackPic}
                className="chat-header-avatar"
                onError={(e) => (e.target.src = fallbackPic)}
                alt="Profile"
              />
              <h4
                className="chat-header-name"
                onClick={() => navigate(`/profile/public/${selectedUser.otherUserId}`)}
              >
                {selectedUser.firstName} {selectedUser.lastName}
              </h4>
            </div>

            <div className="chat-body">
              {Object.entries(groupMessagesByDate()).map(([date, messages]) => (
                <div key={date}>
                  <div className="date-separator">{getDateLabel(date)}</div>
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`chat-bubble ${
                        msg.sender === selectedUser.otherUserId || msg.sender?._id === selectedUser.otherUserId
                          ? "incoming"
                          : "outgoing"
                      }`}
                    >
                      <div>{msg.message}</div>
                      <div className="msg-time">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              {lastSent && isSeen && <div className="seen-label">Seen</div>}
              <div ref={chatEndRef} />
            </div>

            <div className="chat-input">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </div>
        )}
      </div>
    </MobileContainer>
  );
}
