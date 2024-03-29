import { getChats, removeFriend, sendPersonalMessage } from "@/api";
import { RootState } from "@/app/store";
import { useSocket } from "@/context/SocketProvider";
import { addNewChat, addOldChats } from "@/features/user/chatSlice";
import { singleUserList } from "@/features/user/userListSlice";
import { removeUser } from "@/features/user/userSlice";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import ChatBody from "./ChatBody";
import ChatHeader from "./ChatHeader";
import Input from "./Input";

type Props = {
  chatId: string;
  chatName: string;
};

export default function PersonalChat({ chatId, chatName }: Props) {
  const dispatch = useDispatch();
  const socket = useSocket();
  const { _id, username: personalName } = useSelector(
    (state: RootState) => state.auth
  );
  const newChats = useSelector(
    (state: RootState) => state.personalChats.newChats[chatId]
  );

  const oldChats = useSelector(
    (state: RootState) => state.personalChats.oldChats[chatId]
  );

  const { data, isLoading } = useQuery({
    queryKey: ["personal chat", chatId],
    retry: 1,
    staleTime: Infinity,
    queryFn: async () => await getChats(chatId),
  });

  const mutation = useMutation({
    retry: 3,
    mutationKey: ["sendChat", chatId],
    mutationFn: async ({ message, id }: { message: string; id: string }) =>
      await sendPersonalMessage(id, message),
    onSuccess(data, _variables, _context) {
      dispatch(addNewChat({ chatId, message: data.data.data }));
      socket?.emit("personal chat", data.data.data);
    },
  });

  useEffect(() => {
    if (data) {
      if (!oldChats) dispatch(addOldChats({ chatId, message: data.data.data }));
    }
  }, [data]);

  function sendMessage(chatId: string, message: string) {
    mutation.mutateAsync({ id: chatId, message });
  }

  function removeFromList(id: string, username: string) {
    dispatch(removeUser({ _id: id }));
    dispatch(singleUserList({ _id: id, username }));
    socket?.emit("remove user", { id: _id, username: personalName, to: id });
  }

  return (
    <div className="flex flex-col gap-3 h-full relative ">
      <ChatHeader
        removeFromList={removeFromList}
        leave={removeFriend}
        username={chatName}
        id={chatId}
      />
      <ChatBody isLoading={isLoading} newChats={newChats} oldChats={oldChats} />
      <Input chatId={chatId} sendMessage={sendMessage} />
    </div>
  );
}
