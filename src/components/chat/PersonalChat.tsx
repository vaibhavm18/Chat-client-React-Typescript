import { getChats, sendPersonalMessage } from "@/api";
import { RootState } from "@/app/store";
import { addNewChat, addOldChats } from "@/features/user/chatSlice";
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
  console.log("1");
  const dispatch = useDispatch();
  const newChats = useSelector(
    (state: RootState) => state.personalChats.newChats[chatId]
  );

  const oldChats = useSelector(
    (state: RootState) => state.personalChats.oldChats[chatId]
  );

  const { data, isLoading } = useQuery({
    queryKey: ["personalChat", chatId],
    retry: 1,
    staleTime: Infinity,
    queryFn: async () => await getChats(chatId),
  });

  const mutation = useMutation({
    retry: 3,
    mutationKey: ["sendChat", chatId],
    mutationFn: async ({ message, id }: { message: string; id: string }) =>
      await sendPersonalMessage(id, message),
  });

  useEffect(() => {
    if (data) {
      console.log(data.data.data);
      if (!oldChats) dispatch(addOldChats({ chatId, message: data.data.data }));
    }
  }, [data]);

  useEffect(() => {
    if (mutation.data) {
      dispatch(addNewChat({ chatId, message: mutation.data.data.data }));
    }
  }, [mutation.data]);

  function sendMessage(chatId: string, message: string) {
    mutation.mutateAsync({ id: chatId, message });
  }

  return (
    <div className="flex flex-col gap-3 h-full ">
      <ChatHeader username={chatName} id={chatId} />
      <ChatBody isLoading={isLoading} newChats={newChats} oldChats={oldChats} />
      <Input chatId={chatId} sendMessage={sendMessage} />
    </div>
  );
}
