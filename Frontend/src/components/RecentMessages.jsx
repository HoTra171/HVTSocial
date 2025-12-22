import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import axios from "axios";

dayjs.extend(relativeTime);

const RecentMessages = ({ }) => {

    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    setLoading(false);
                    navigate("/");
                    return;
                }

                // 1) Lấy user hiện tại từ backend
                const meRes = await axios.get("http://localhost:5000/api/auth/me", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const userId = meRes.data?.user?.id ?? meRes.data?.id;
                if (!userId) {
                    setLoading(false);
                    navigate("/");
                    return;
                }

                // 2) Lấy chat list theo userId thật
                const res = await axios.get(
                    `http://localhost:5000/api/chat/user/${userId}/chats`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                const sorted = (res.data || []).sort((a, b) => {
                    if (a.unread_count > 0 && b.unread_count === 0) return -1;
                    if (a.unread_count === 0 && b.unread_count > 0) return 1;
                    return new Date(b.last_time) - new Date(a.last_time);
                });


                setMessages(sorted);
            } catch (err) {
                console.error("Failed to fetch messages:", err);
                // token lỗi/het hạn -> về login
                navigate("/");
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();
    }, [navigate]);

    if (loading) return null;

    return (
        <div className='bg-white max-w-xs mt-4 p-4 min-h-20 rounded-md shadow text-xs text-slate-800'>
            <h3 className='font-semibold text-slate-800 mb-4'>Recent Messages</h3>

            <div className='flex flex-col max-h-56 overflow-y-scroll no-scrollbar'>
                {messages.map((message, index) => (
                    <Link
                        to={`/messages/${message.chat_id}`}
                        key={message.chat_id}
                        className='flex items-center gap-3 py-2 hover:bg-slate-100 rounded-lg px-2'
                    >
                        <img
                            src={message.is_group_chat ? "/group.png" : message.avatar || "/default.jpg"}
                            alt=""
                            className='w-10 h-10 rounded-full flex-shrink-0'
                        />

                        <div className='flex-1 min-w-0'>
                            <div className='flex justify-between items-baseline gap-2'>
                                <p className='font-medium text-sm truncate'>{message.target_name}</p>
                                <p className='text-[10px] text-slate-400 flex-shrink-0'>
                                    {dayjs(message.last_time).fromNow()}
                                </p>
                            </div>

                            <p className='text-xs text-gray-500 truncate'>
                                {message.last_message || "Media"}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default RecentMessages;

