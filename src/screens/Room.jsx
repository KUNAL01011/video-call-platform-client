import React, { useCallback, useEffect, useState } from "react";
import { useSocket } from "../context/SocketProvider";
import ReactPlayer from "react-player";
import peer from "../service/peer";
import Canvas from "../components/Canvas";
import { useParams } from "react-router-dom";

const Room = () => {
  const roomId = useParams();
  const [remoteSocketId, setRemoteSocketId] = useState("");
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const socket = useSocket();

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`Email ${email} joined room : ${id}`);
    setRemoteSocketId(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    const offer = await peer.getOffer();
    console.log("calling the user : ", offer, remoteSocketId);
    socket.emit("user:call", { to: remoteSocketId, offer });
    setMyStream(stream);
  }, [remoteSocketId, socket]);

  const handleIncommingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);
      console.log("inncoming call : ", from, offer);
      const ans = await peer.getAnswer(offer);
      console.log("ans : ", ans);
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket]
  );

  const sendStream = useCallback(() => {
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream);
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      console.log("call accepted : ", from);
      console.log("ans ; ", ans);
      peer.setLocalDescription(ans);
      console.log("call accepeted");
      sendStream();
    },
    [sendStream]
  );

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    console.log("nego : ", offer);
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  const handleNegoNeedIncomming = useCallback(
    async ({ from, offer }) => {
      console.log("nego incomming : ", offer);
      const ans = await peer.getAnswer(offer);
      console.log("nego ans : ", ans);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );
  const handleNegoFinal = useCallback(async ({ ans }) => {
    console.log("ans :- ", ans);
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  useEffect(() => {
    peer.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      setRemoteStream(remoteStream[0]);
    });
  }, []);
  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoFinal);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoFinal);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncommingCall,
    handleCallAccepted,
    handleNegoNeedIncomming,
    handleNegoFinal,
  ]);
  return (
    <div className="w-screen h-screen p-10 flex gap-4">
      <div className="flex flex-col gap-4 justify-between relative">
        <div className="border-2 w-[300px] h-[300px] rounded-lg">
          {remoteStream && (
            <ReactPlayer
              playing
              muted
              height={300}
              width={295}
              url={remoteStream}
            />
          )}
        </div>
        <div className="relative">
          <div className="border-2 w-[300px] h-[300px] rounded-lg">
            {myStream && (
              <ReactPlayer
                playing
                muted
                height={300}
                width={295}
                url={myStream}
              />
            )}
          </div>
        </div>
      </div>
      <div className="w-[80%] h-full border-2 rounded-lg relative">
        {remoteSocketId ? (
          <p className="absolute right-2 text-green-400 text-xl">Connected</p>
        ) : (
          <p className="absolute right-2 text-amber-500 text-xl">Pending...</p>
        )}

        <div className="overflow-hidden w-full h-[80%]">
          <Canvas roomId={roomId} remoteSocketId={remoteSocketId} />
        </div>
        <div className="flex justify-center items-center h-[20%]">
          {remoteSocketId ? (
            <button
              className="border-2 px-4 py-2 rounded-lg bg-green-400"
              onClick={handleCallUser}
            >
              Share Camera
            </button>
          ) : (
            <></>
          )}
        </div>
      </div>
    </div>
  );
};

export default Room;

// 34.06
