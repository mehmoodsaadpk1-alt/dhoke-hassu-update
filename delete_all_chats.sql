-- Run this in the Supabase SQL Editor to permanently delete all chats for all users
DELETE FROM public.messages;
DELETE FROM public.conversation_members;
DELETE FROM public.conversations;
