/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef, createContext } from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer";

const SocketContext = createContext();

const socket = io("http://localhost:5000");

const ContextProvider = ({ children }) => {
  const [stream, setStream] = useState(null);
  const [me, setMe] = useState("");
  const [call, setCall] = useState({});
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [name, setName] = useState("");

  const myVideo = useRef(null);
  const userVideo = useRef(null);
  const connectionRef = useRef();

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        myVideo.current.srcObject = currentStream;
      });
    socket.on("me", (id) => setMe(id));
    socket.on("calluser", ({ from, name: callerName, signal }) => {
      setCall({ isReceivedCall: true, from, name: callerName, signal });
    });
  }, []);

  // an alternative way I tried
  // useEffect(() => {
  //   const getUserMedia = async () => {
  //     try {
  //       const stream = await navigator.mediaDevices.getUserMedia({
  //         video: true,
  //         audio: true,
  //       });
  //       setStream(stream);
  //       myVideo.current.srcObject = stream;
  //     } catch (err) {
  //       console.log(err);
  //     }
  //   };
  //   getUserMedia();
  //   socket.on("me", (id) => setMe(id));
  //   socket.on("calluser", ({ from, name: callerName, signal }) => {
  //     setCall({ isReceivedCall: true, from, name: callerName, signal });
  //   });
  // }, []);

  // another alternative way I tried but didn't work.
  // useEffect(() => {
  //   const getUserMedia = async () => {
  //     const stream = await navigator.mediaDevices.getUserMedia({
  //       video: true,
  //       audio: true,
  //     });
  //     setStream(stream);
  //     myVideo.current.srcObject = stream;
  //   };
  //   // getUserMedia();
  //   (async () => await getUserMedia())();
  //   socket.on("me", (id) => setMe(id));
  //   socket.on("calluser", ({ from, name: callerName, signal }) => {
  //     setCall({ isReceivedCall: true, from, name: callerName, signal });
  //   });
  // }, []);

  const answerCall = () => {
    setCallAccepted(true);

    const peer = new Peer({ initiator: false, trickle: false, stream });

    peer.on("signal", (data) => {
      socket.emit("answercall", { signal: data, to: call.from });
    });

    peer.on("stream", (currentStream) => {
      userVideo.current.srcObject = currentStream;
    });

    peer.signal(call.signal);

    connectionRef.current = peer;
  };

  const callUser = (id) => {
    const peer = new Peer({ initiator: true, trickle: false, stream });

    peer.on("signal", (data) => {
      socket.emit("calluser", {
        signalData: data,
        from: me,
        name,
        userToCall: id,
      });
    });

    peer.on("stream", (currentStream) => {
      userVideo.current.srcObject = currentStream;
    });

    socket.on("callaccepted", (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);
    connectionRef.current.destroy();
    window.location.reload();
  };

  <SocketContext.Provider
    value={{
      stream,
      me,
      call,
      callAccepted,
      callEnded,
      name,
      setName,
      answerCall,
      callUser,
      leaveCall,
      myVideo,
      userVideo,
    }}
  >
    {children}
  </SocketContext.Provider>;
};

export { ContextProvider, SocketContext };
