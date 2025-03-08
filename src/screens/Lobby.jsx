import React, { useCallback, useEffect, useState } from "react";
import { useSocket } from "../context/SocketProvider";
import { useNavigate } from "react-router-dom";

const Lobby = () => {
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");


  const socket = useSocket();
  const navigate = useNavigate();

  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      socket.emit("join-room", { email, room });
    },
    [email, room, socket]
  );

  const handleJoinRoom = useCallback(
    (data) => {
      const { email, room } = data;
      navigate(`/room/${room}`);
    },
    [navigate]
  );


  useEffect(() => {
    socket.on("join-room", handleJoinRoom);

    return () => {
      socket.off("join-room", handleJoinRoom);
    };
  }, [socket, handleJoinRoom]);


  return (
    <div className="w-screen h-screen flex justify-center items-center">
     <form onSubmit={handleSubmitForm} className="border-2 flex flex-col p-10 rounded-lg shadow-lg gap-2">
        <label htmlFor="email" className="font-semibold text-2xl">Email ID</label>
        <input
         className="border-1 rounded-lg px-2 py-1 w-sm "
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          
        />
        <br />
        <label htmlFor="room" className="font-semibold text-2xl mt-3">Room Number</label>
        <input
          type="text"
          id="room"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          className="border-1 rounded-lg px-2 py-1 w-sm"
        />
        <br />
        <button type="submit" className="border mt-3.5 py-1 bg-blue-400 font-bold rounded-lg w-[50%] cursor-pointer">
          Join
        </button>
      </form>
    </div>
  );
};

export default Lobby;
